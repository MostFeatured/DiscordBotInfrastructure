import { createDBI } from "./src";

let dbi = createDBI("namespace", {
  discord: {
    token: ""
  },
  sharding: {
    clusterCount: 4,
    shardCountPerCluster: 4
  },
  store: {
    async get(key, defaultValue) {
      return "";
    },
    async del(key) {
      return;
    },
    async has(key) {
      return true;
    },
    async set(key) {
      return;
    },
  }
});

//DJS CLIENT
dbi.client;
//CONFIG
dbi.config;


dbi.register((api) => {


  
})