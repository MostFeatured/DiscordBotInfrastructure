import { DBI, Pack, Inspector, Locales } from '@mostfeatured/dbi';

const dbi = new DBI();

const pack = new Pack({ name: 'ExamplePack' });
const inspector = new Inspector({ name: 'ExampleInspector' });
const locales = new Locales({ name: 'ExampleLocales' });

pack.onUnload(
  locales.loadFile({
    id: 'Example',
    filePath: 'example.json',
    path: '$',
    type: "Content"
  }),
  locales.addLocale({
    id: "Example2",
    locale: "",
    data: {}
  }),
  locales.addInteractionLocale({
    id: "Example3",
    locale: "",
    name: "system set settings",
    data: {}
  })
)


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