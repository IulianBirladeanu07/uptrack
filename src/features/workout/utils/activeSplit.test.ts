import { afterSplitDelete } from './activeSplit';

const remaining = [{ id: 'b' }, { id: 'c' }];

describe('afterSplitDelete', () => {
  it('moves the local selection to the first remaining split and clears the stored id', () => {
    expect(afterSplitDelete('a', remaining, 'a', 'a')).toEqual({ localActiveId: 'b', clearPersisted: true });
  });

  it('leaves everything alone when another split is deleted', () => {
    expect(afterSplitDelete('c', [{ id: 'a' }, { id: 'b' }], 'a', 'a')).toEqual({ localActiveId: 'a', clearPersisted: false });
  });

  it('moves the fallback selection when no id is stored', () => {
    expect(afterSplitDelete('a', remaining, 'a', undefined)).toEqual({ localActiveId: 'b', clearPersisted: false });
    expect(afterSplitDelete('a', remaining, 'a', null)).toEqual({ localActiveId: 'b', clearPersisted: false });
  });

  it('clears the stored id even when the local selection differs', () => {
    expect(afterSplitDelete('a', remaining, 'c', 'a')).toEqual({ localActiveId: 'c', clearPersisted: true });
  });

  it('selects nothing after deleting the last split', () => {
    expect(afterSplitDelete('a', [], 'a', 'a')).toEqual({ localActiveId: null, clearPersisted: true });
  });
});
