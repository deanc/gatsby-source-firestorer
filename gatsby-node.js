const report = require('gatsby-cli/lib/reporter');
const firebaseAdmin = require('firebase-admin');
const firebaseWeb = require('firebase');
require('firebase/firestore');

const applyConditions = (collection, conditions) => {
  if (!conditions || !conditions.length) {
    return collection;
  }
  return conditions.reduce(
    (coll, condition) => coll.where.apply(coll, condition),
    collection
  );
};

const initFirebase = (credential, config) => {
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
    return firebase;
  } catch (e) {
    report.warn(
      'Could not initialize Firebase. Please check `credential` property in gatsby-config.js or supply a valid config object'
    );
    report.warn(e);
    return;
  }
};

exports.sourceNodes = async (
  { actions, createContentDigest },
  { types, credential, config }
) => {
  const firebase = initFirebase(credential, config);
  const db = firebase.firestore();

  const { createNode } = actions;

  async function getSubCollections(parentCollection, parentId, types) {
    const promises = [];

    types.forEach(subCollection => {
      promises.push(
        new Promise(async resolve => {
          const subCollectionPath = `${parentCollection}/${parentId}/${subCollection.collection}`;
          const subCollectionSnapshot = await db
            .collection(subCollectionPath)
            .get();
          let nodes = [];
          subCollectionSnapshot.forEach(scDoc => {
            nodes.push({
              id: scDoc.id,
              ...scDoc.data(),
            });
          });
          resolve({
            type: subCollection.collection,
            data: nodes,
          });
        })
      );
    });

    const res = await Promise.all(promises);
    const reshaped = {};
    res.forEach(r => {
      reshaped[r.type] = r.data;
    });
    return reshaped;
  }

  // creates node for provided type
  async function createDocumentNode({ type }) {
    // get records for current type from firestore

    const conditionedCollection = applyConditions(
      db.collection(type.collection),
      type.conditions
    );

    const snapshot = await conditionedCollection.get();
    const promises = [];
    snapshot.forEach(doc => {
      promises.push(
        new Promise(async resolve => {
          let children = {};
          if (type.subCollections) {
            children = await getSubCollections(
              type.collection,
              doc.id,
              type.subCollections
            );
          }
          // create node for current type
          createNode({
            id: doc.id,
            // parent: parent ? parent.id : null,
            firestoreChildren: children,
            internal: {
              type: type.type,
              contentDigest: createContentDigest(doc.id),
            },
            ...type.map(doc.data()),
          });
          // resolve with current document ID
          resolve(doc.id);
        })
      );
    });
    return Promise.all(promises);
  }

  await Promise.all(types.map(type => createDocumentNode({ type })));

  return;
};
