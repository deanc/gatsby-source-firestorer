const report = require('gatsby-cli/lib/reporter');
const firebaseAdmin = require('firebase-admin');
const firebaseWeb = require('firebase');
require('firebase/firestore');

exports.sourceNodes = async (
  { actions, createContentDigest },
  { types, credential, config }
) => {
  let firebase = firebaseWeb;
  if (credential) {
    firebase = firebaseAdmin;
  }

  try {
    if (credential) {
      firebase.initializeApp({
        credential: firebase.credential.cert(credential),
      });
    } else {
      firebase.initializeApp(config);
    }
  } catch (e) {
    report.warn(
      'Could not initialize Firebase. Please check `credential` property in gatsby-config.js or supply a valid config object'
    );
    report.warn(e);
    return;
  }

  const db = firebase.firestore();

  const { createNode } = actions;

  const promises = types.map(
    async ({ collection, type, map = node => node }) => {
      const snapshot = await db.collection(collection).get();
      for (let doc of snapshot.docs) {
        const nodeData = map(doc.data());
        const nodeMeta = {
          id: doc.id,
          parent: null,
          children: [],
          internal: {
            type,
            content: JSON.stringify(nodeData),
            contentDigest: createContentDigest(nodeData),
          },
        };
        createNode(Object.assign({}, nodeData, nodeMeta));
        Promise.resolve();
      }
    }
  );

  await Promise.all(promises);

  return;
};
