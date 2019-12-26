const report = require('gatsby-cli/lib/reporter');
const firebase = require('firebase-admin');

exports.sourceNodes = async (
  { actions, createNodeId, createContentDigest },
  { types, credential }
) => {
  try {
    firebase.initializeApp({
      credential: firebase.credential.cert(credential),
    });
  } catch (e) {
    report.warn(
      'Could not initialize Firebase. Please check `credential` property in gatsby-config.js'
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
