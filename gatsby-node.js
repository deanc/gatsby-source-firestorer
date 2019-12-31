const report = require('gatsby-cli/lib/reporter');
const firebaseAdmin = require('firebase-admin');
const firebaseWeb = require('firebase');
require('firebase/firestore');

const applyConditions = (collection, conditions) =>
  conditions.reduce(
    (coll, condition) => coll.where.apply(coll, condition),
    collection
  );

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
    async ({ collection, type, map = node => node, conditions }) => {
      const conditionedCollection = applyConditions(
        db.collection(collection),
        conditions
      );
      const snapshot = await conditionedCollection.get();
      for (let doc of snapshot.docs) {
        const nodeData = map(doc.data());
        const nodeMeta = {
          id: doc.id,
          parent: null,
          children: [],
          internal: {
            type,
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
