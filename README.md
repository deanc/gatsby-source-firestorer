# @deanc/gatsby-source-firestorer [![npm version](https://badge.fury.io/js/%40deanc%2Fgatsby-source-firestorer.svg)](https://badge.fury.io/js/%40deanc%2Fgatsby-source-firestorer)

Gatsby source plugin for building websites using the Firestore as a data source. Forked from a couple of other versions and updated to use
latest Gatsby params.

# Authentication

You have two ways to authenticate to Firebase.

1. (Reccommended) Supply a valid firebaseConfig object with read-only credentials. [Instructions here](https://support.google.com/firebase/answer/7015592#web).
2. Get a private key for your Firebase project from the Firebase console.

# Usage

## Method 1: Standard web SDK (Reccommended)

1. Supply a valid firebaseConfig object
2. `$ yarn add @deanc/gatsby-source-firestore`
3. Configure `gatsby-config.js`

```javascript
module.exports = {
  plugins: [
    {
      resolve: '@deanc/gatsby-source-firestore',
      options: {
        config: {
          apiKey: 'api-key',
          authDomain: 'project-id.firebaseapp.com',
          databaseURL: 'https://project-id.firebaseio.com',
          storageBucket: 'yourapp.appspot.com',
          projectId: 'project-id',
          messagingSenderId: 'sender-id',
          appId: 'app-id',
          measurementId: 'measurement-id',
        },
        types: [
          {
            type: 'Book',
            collection: 'books',
            map: doc => ({
              title: doc.title,
              isbn: doc.isbn,
              author___NODE: doc.author.id,
            }),
            conditions: [['status', '==', 'public']], // optional
          },
          {
            type: 'Author',
            collection: 'authors',
            map: doc => ({
              name: doc.name,
              country: doc.country,
              books___NODE: doc.books.map(book => book.id),
            }),
          },
        ],
      },
    },
  ],
};
```

## Method 2: Firebase Admin SDK

1. Get a private key for your Firebase project.
2. Put that private key somewhere in your Gatsby project.
3. `$ yarn add @deanc/gatsby-source-firestore`
4. Configure `gatsby-config.js`

```javascript
module.exports = {
  plugins: [
    {
      resolve: '@deanc/gatsby-source-firestore',
      options: {
        credential: require('./firebase.credentials.json'),
        types: [
          {
            type: 'Book',
            collection: 'books',
            map: doc => ({
              title: doc.title,
              isbn: doc.isbn,
              author___NODE: doc.author.id,
            }),
            conditions: [['status', '==', 'public']], // optional
          },
          {
            type: 'Author',
            collection: 'authors',
            map: doc => ({
              name: doc.name,
              country: doc.country,
              books___NODE: doc.books.map(book => book.id),
            }),
          },
        ],
      },
    },
  ],
};
```

# Querying

To query

```graphql
{
  allBooks {
    edges {
      node {
        title
        isbn
        author {
          name
        }
      }
    }
  }
}
```

# Configurations

| Key        | Description                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| credential | Require your private key here                                                                                                                          |
| config     | Put a valid firebaseConfig object here                                                                                                                 |
| types      | Array of types, which require some of the following 3 keys                                                                                             |
| type       | (required) The type of the collection, which will be used in GraphQL queries. Eg, when `type = Book`, the GraphQL types are named `book` and `allBook` |
| collection | (required) The name of the collections in Firestore. Nested collections are **not** tested.                                                            |
| map        | (required) A function to map your data in Firestore to Gatsby nodes, utilize the undocumented `___NODE` to link between nodes                          |
| conditions | (optional) An array of where conditions. Corresponds directly to: https://firebase.google.com/docs/firestore/query-data/queries#simple_queries         |

# Disclaimer

No maintenance/warranty are provided. Feel free to send in pull requests.

# Acknowledgement

- [gatsby-source-firebase (Original)](https://github.com/ReactTraining/gatsby-source-firebase)
- [gatsby-source-firebase (Most recent fork)](https://github.com/tomphill/gatsby-source-firestore)
