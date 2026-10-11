const toCustomDoc = (ex, group) => ({
  uid: ex.createdBy,
  name: ex.name,
  muscleGroup: ex.muscleGroup || group,
  category: ex.category || 'General',
  equipment: ex.equipment || 'Bodyweight',
  imageURL: ex.imageURL || '',
  difficulty: ex.difficulty || 'Intermediate',
  createdAt: ex.createdAt || new Date().toISOString(),
});

const docId = (c) => `${c.uid}_${c.muscleGroup}_${c.name}`.replace(/\//g, '-');

const plan = (group, exercises) => {
  const list = exercises || [];
  const custom = list.filter(e => e && e.isCustom);
  return {
    keep: list.filter(e => !(e && e.isCustom)),
    moves: custom.filter(e => e.createdBy).map(e => {
      const doc = toCustomDoc(e, group);
      return { id: docId(doc), doc };
    }),
    orphans: custom.filter(e => !e.createdBy),
  };
};

const main = async () => {
  const admin = require('firebase-admin');
  const path = require('path');
  const [keyPath, flag] = process.argv.slice(2);
  if (!keyPath) {
    console.error('usage: node migrate-custom-exercises.js <serviceAccount.json> [--apply]');
    process.exit(1);
  }
  const apply = flag === '--apply';
  admin.initializeApp({ credential: admin.credential.cert(require(path.resolve(keyPath))) });
  const db = admin.firestore();

  const snap = await db.collection('exercises').get();
  for (const d of snap.docs) {
    const { keep, moves, orphans } = plan(d.id, d.data().exercises);
    if (!moves.length && !orphans.length) continue;
    console.log(`${d.id}: move ${moves.length}, drop ${orphans.length} without createdBy, keep ${keep.length}`);
    orphans.forEach(e => console.log(`  dropped: ${e.name}`));
    if (!apply) continue;
    const batch = db.batch();
    moves.forEach(m => batch.set(db.collection('customExercises').doc(m.id), m.doc));
    await batch.commit();
    await d.ref.update({ exercises: keep });
  }
  console.log(apply ? 'done' : 'dry run, pass --apply to write');
};

if (require.main === module) main().catch(e => { console.error(e); process.exit(1); });

module.exports = { plan };
