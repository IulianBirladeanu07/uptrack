import { getAuth } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';
import { queryClient } from '../../../shared/query/queryClient';
import { clearSplitsCache } from './splitCache';
import { workoutSplitQueryKey, workoutTemplateQueryKey } from './workoutQueryKeys';
import type { TemplateInput, WorkoutTemplate } from '../types';
import {
  assertTemplateNameAvailable,
  getTemplateNameKey,
  getTemplateNameRegistry,
  TemplateNameAlreadyExistsError,
} from './templateNameRegistry';

export { TemplateNameAlreadyExistsError } from './templateNameRegistry';

const invalidateWorkoutTemplates = async (uid: string): Promise<void> => {
  await queryClient.invalidateQueries({ queryKey: workoutTemplateQueryKey(uid) });
  await queryClient.invalidateQueries({ queryKey: workoutSplitQueryKey(uid) });
  await clearSplitsCache();
};

export const addTemplateToFirestore = async (
  templateData: TemplateInput,
  templateName: string,
): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated.');
    }

    const normalizedTemplateName = templateName.trim();
    const formattedTemplateName = `${encodeURIComponent(normalizedTemplateName.toLowerCase())}_${user.uid}`;
    const fullTemplateData = {
      ...templateData,
      templateName: normalizedTemplateName,
      uid: user.uid,
    };

    const templateDocRef = doc(db, 'workoutTemplates', formattedTemplateName);
    const templatesQuery = query(
      collection(db, 'workoutTemplates'),
      where('uid', '==', user.uid),
    );
    const templatesSnapshot = await getDocs(templatesQuery);
    assertTemplateNameAvailable(templatesSnapshot.docs, normalizedTemplateName);
    const idInUse = templatesSnapshot.docs.some(template => template.id === formattedTemplateName);
    const userDocRef = doc(db, 'users', user.uid);
    const nameKey = getTemplateNameKey(normalizedTemplateName);
    let savedTemplateId = formattedTemplateName;

    await runTransaction(db, async transaction => {
      const userDoc = await transaction.get(userDocRef);
      const nameRegistry = getTemplateNameRegistry(userDoc.exists() ? userDoc.data() : undefined);
      if (nameRegistry[nameKey]) throw new TemplateNameAlreadyExistsError();

      let targetRef = templateDocRef;
      savedTemplateId = formattedTemplateName;
      if (idInUse || Object.values(nameRegistry).includes(formattedTemplateName)) {
        savedTemplateId = `${doc(collection(db, 'workoutTemplates')).id}_${user.uid}`;
        targetRef = doc(db, 'workoutTemplates', savedTemplateId);
      }

      nameRegistry[nameKey] = savedTemplateId;
      transaction.set(
        userDocRef,
        { workoutTemplateNames: nameRegistry },
        { mergeFields: ['workoutTemplateNames'] },
      );
      transaction.set(targetRef, fullTemplateData);
    });
    await invalidateWorkoutTemplates(user.uid);
    return savedTemplateId;
  } catch (error) {
    console.error('Error adding template data to Firestore:', (error as Error).message);
    throw error;
  }
};

export const loadTemplatesFromFirestore = async (uid: string): Promise<WorkoutTemplate[]> => {
  try {
    const templatesCollectionRef = collection(db, 'workoutTemplates');
    const templatesQuery = query(templatesCollectionRef, where('uid', '==', uid));
    const querySnapshot = await getDocs(templatesQuery);
    return querySnapshot.docs.map(docSnap => ({
      ...(docSnap.data() as WorkoutTemplate),
      id: docSnap.id,
    }));
  } catch (error) {
    console.error('Error retrieving user templates from Firestore:', (error as Error).message);
    throw error;
  }
};

export const fetchTemplatesFromFirestore = async (uid: string): Promise<WorkoutTemplate[]> =>
  queryClient.fetchQuery({
    queryKey: workoutTemplateQueryKey(uid),
    staleTime: 5 * 60 * 1000,
    queryFn: () => loadTemplatesFromFirestore(uid),
  });

export const deleteTemplateFromFirestore = async (templateId: string): Promise<boolean> => {
  try {
    if (!templateId) throw new Error('No template ID provided');

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated.');

    const templateRef = doc(db, 'workoutTemplates', templateId);
    const userDocRef = doc(db, 'users', user.uid);
    await runTransaction(db, async transaction => {
      const [userDoc, templateDoc] = await Promise.all([
        transaction.get(userDocRef),
        transaction.get(templateRef),
      ]);
      const nameRegistry = getTemplateNameRegistry(userDoc.exists() ? userDoc.data() : undefined);
      const templateName = templateDoc.exists() ? templateDoc.data()['templateName'] : undefined;
      if (typeof templateName === 'string') {
        const nameKey = getTemplateNameKey(templateName);
        if (nameRegistry[nameKey] === templateId) {
          delete nameRegistry[nameKey];
          transaction.set(
            userDocRef,
            { workoutTemplateNames: nameRegistry },
            { mergeFields: ['workoutTemplateNames'] },
          );
        }
      }
      transaction.delete(templateRef);
    });
    await invalidateWorkoutTemplates(user.uid);
    return true;
  } catch (error) {
    console.error('Error deleting template from Firestore:', (error as Error).message);
    throw error;
  }
};

export const updateTemplateInFirestore = async (
  templateId: string,
  templateData: Partial<TemplateInput>,
): Promise<string> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!templateId) {
      throw new Error('Template ID is required for update');
    }

    const templateRef = doc(db, 'workoutTemplates', templateId);
    const normalizedTemplateName = templateData.templateName?.trim();
    if (templateData.templateName !== undefined && !normalizedTemplateName) {
      throw new Error('Template name cannot be empty');
    }

    const updateData: Record<string, unknown> = { updatedAt: serverTimestamp() };
    if (normalizedTemplateName !== undefined) updateData['templateName'] = normalizedTemplateName;
    if (templateData.exercises !== undefined) updateData['exercises'] = templateData.exercises;
    if (templateData.note !== undefined) updateData['note'] = templateData.note;
    if (templateData.duration !== undefined) updateData['duration'] = templateData.duration;
    if (templateData.preferredDays !== undefined) updateData['preferredDays'] = templateData.preferredDays;
    if (templateData.workoutType !== undefined) updateData['workoutType'] = templateData.workoutType;

    if (normalizedTemplateName !== undefined) {
      const templatesQuery = query(
        collection(db, 'workoutTemplates'),
        where('uid', '==', user.uid),
      );
      const templatesSnapshot = await getDocs(templatesQuery);
      assertTemplateNameAvailable(templatesSnapshot.docs, normalizedTemplateName, templateId);

      const userDocRef = doc(db, 'users', user.uid);
      const nameKey = getTemplateNameKey(normalizedTemplateName);
      await runTransaction(db, async transaction => {
        const [userDoc, templateDoc] = await Promise.all([
          transaction.get(userDocRef),
          transaction.get(templateRef),
        ]);
        const nameRegistry = getTemplateNameRegistry(userDoc.exists() ? userDoc.data() : undefined);
        const existingTemplateName = templateDoc.exists() ? templateDoc.data()['templateName'] : undefined;
        if (typeof existingTemplateName === 'string') {
          const previousNameKey = getTemplateNameKey(existingTemplateName);
          if (nameRegistry[previousNameKey] === templateId) delete nameRegistry[previousNameKey];
        }
        if (nameRegistry[nameKey] && nameRegistry[nameKey] !== templateId) {
          throw new TemplateNameAlreadyExistsError();
        }
        nameRegistry[nameKey] = templateId;
        transaction.set(
          userDocRef,
          { workoutTemplateNames: nameRegistry },
          { mergeFields: ['workoutTemplateNames'] },
        );
        transaction.update(templateRef, updateData);
      });
    } else {
      await updateDoc(templateRef, updateData);
    }
    await invalidateWorkoutTemplates(user.uid);
    return templateId;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
};
