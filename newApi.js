import { DBI, Pack, Inspector, Locales } from '@mostfeatured/dbi';

const dbi = new DBI();

const pack = new Pack({ name: 'examplePack' });
const inspector = new Inspector({ name: 'exampleInspector' });
const locales = new Locales({ name: 'exampleLocales' });

pack.onUnload(
  locales.loadFile({
    id: 'example',
    filePath: 'example.json',
    path: '$',
    type: "Content"
  }),
  locales.addLocale("en", {})
)
// dc açılmıo lan equicordla bile hiç bi şekilde bozuldu nedense
locales.addInteractionLocale("en", "example interaction", {

})
const pattern = 'system (set|unset) settings';
pack.event({

})

inspector.event({
  name: 'exampleEvent', // '*' // '*' for all events
  handle(ctx) { // return true/false to stop the event

  }
});  // () => { } // unloader

// 'system (set|unset) settings' minimatch glob
inspector.onChatInput('system (set|unset) settings', () => {

})  // () => { } // unloader

inspector.onButton({
  id: "",
  handle() {

  }
})

pack.use(inspector);  // () => { } // unloader
pack.use(locales);  // () => { } // unloader

dbi.use(pack);  // () => { } // unloader