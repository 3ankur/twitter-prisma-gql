import { objectType } from 'nexus';

export const Tweet = objectType({
  name: 'Tweet',
  definition(t:any) {
    t.model.id()
    t.model.content()
  },
})