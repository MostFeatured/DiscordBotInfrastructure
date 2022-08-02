import { createDBI } from "./src";

let dbi = createDBI("namespace", {
  discord: {
    token: ""
  },
  sharding: {
    clusterCount: 4,
    shardCountPerCluster: 4
  },
});

//DJS CLIENT
dbi.client;
//CONFIG
dbi.config;


dbi.register((api) => {


  
})