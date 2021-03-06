import createSagaMiddleware from 'redux-saga';
import configureMockStore from 'redux-mock-store';
import * as sagas from './sagas';
import * as actions from './actions';
import * as oauthActions from '../auth/oauth/actions';
import {introspectionQuery, buildClientSchema, graphql} from 'graphql';
import {addMockFunctionsToSchema} from 'graphql-tools';
import {print} from 'graphql/language/printer';
import { put,call,takeEvery,select } from 'redux-saga/effects';
import * as introspectionResult from '../../api/schema.json';
import {
  CURRENT_USER_QUERY,
  ARTICLES_BY_USER_QUERY,
  createArticleMutation,
  deleteArticleMutation,
  updateArticleMutation,
  getSignedUrls,
  addS3Files,
} from '../../api/apolloProxy';
import { cloneableGenerator } from 'redux-saga/utils';
import { testSaga, expectSaga } from 'redux-saga-test-plan';
import * as matchers from 'redux-saga-test-plan/matchers';

import * as data from '../../api/__mocks__/data';

const articles = data.ARTICLES_BY_USER_DATA;

import { articlesByUser,createArticle,selectArticles } from '../../api/apolloProxy';
import { formatFetchArticlesResult, removeArticleFromArticles, updateArticlesWithArticle, getArticleFromNid } from './utilities';
import {
  types as articleActionTypes,
  fetchArticlesSuccess,
  fetchArticlesFailure,
  createArticleSuccess,
  createArticleFailure,
  deleteArticleSuccess,
  deleteArticleFailure,
  saveArticleUpdatesSuccess,
  saveArticleUpdatesFailure,
} from './actions';

const sagaMiddleware = createSagaMiddleware();
const mockStore = configureMockStore([sagaMiddleware]);

describe('the sagas', () => {

  it('should execute the fetchArticlesSaga action creator and fail the call to articlesByUser', () => {
    const store = mockStore({});
    sagaMiddleware.run(sagas.watchArticleActions); // has to be executed after the mockStore() call

    const expectedActions = [
      {
        type: 'FETCH_ARTICLES'
      }, {
        type: 'TOKENS_EXPIRED_CHECK'
      }, {
        type: 'TOKENS_EXPIRED_CHECK_VALID'
      }, {
        error: 'Error: Network error: Network request failed',
        type: 'FETCH_ARTICLES_FAILURE'
      }
    ];

    store.subscribe(() => {
      const storeActions = store.getActions();
      let refreshCheck;

      storeActions.forEach(function(item) {
        if (item.type === 'TOKENS_EXPIRED_CHECK') {
          refreshCheck = 'valid';
        } else {
          refreshCheck = 'invalid';
        }
      })

      if (refreshCheck === 'valid') {
        store.dispatch({type: oauthActions.TOKENS_EXPIRED_CHECK_VALID});
      }

      if (storeActions.length >= expectedActions.length) {
        expect(storeActions.sort()).toEqual(expectedActions.sort());
      }

    });

    store.dispatch({type: actions.FETCH_ARTICLES});
  });



  it('should execute the fetchArticlesSaga action creator and succeed', () => {

    const schema = buildClientSchema(introspectionResult);
    addMockFunctionsToSchema({schema});

    const saga = expectSaga(sagas.fetchArticlesSaga);

    graphql(schema,print(ARTICLES_BY_USER_QUERY),null).then((result) => {

      const images = articles.data.user.nodes.articles.map(node =>
        node.images = {
          ...node.images,
          entity: {
            image: {
              derivative: {
                url: '',
              },
            },
          },
          mid: '',
        });

        articles.data.user.nodes.articles[0].images = images;
        articles.data.user.nodes.articles[1].images = images;

        const testData = formatFetchArticlesResult(articles);

        saga
        .provide([
          [matchers.call.fn(articlesByUser), articles],
        ])
        .put({type: 'TOKENS_EXPIRED_CHECK'})
        .put(fetchArticlesSuccess({ articles: testData }))
        .dispatch({type: oauthActions.TOKENS_EXPIRED_CHECK_VALID})
        .run()
      });

  });

  it('should execute the createArticleSaga and succeed', () => {

    const schema = buildClientSchema(introspectionResult);
    addMockFunctionsToSchema({schema});

    const mockOutputCreateArticle = {
      data:{
        createArticle: {
          page:{
            author: {name:"admin"},
            body: null,
            images: [],
            nid: 18,
            title: "NULL",
            uuid: 'c0ee6953-0398-4823-9bd8-1b1ef1896fc4'
          }
        }
      }
    }

    const payload = {
      payload:{
        title: "NULL"
      }
    }

    const page = mockOutputCreateArticle.data.createArticle.page;

    const storeState = {
      articleReducer:{
        ...articles.data.user.nodes
      }
    };

    let updatedStoreState = {
      articleReducer:{
        ...articles.data.user.nodes
      }
    };

    updatedStoreState = articles.data.user.nodes.articles.concat([page]);

    const saga = expectSaga(sagas.createArticleSaga,payload);

    graphql(schema, print(createArticleMutation), null, null, { title: 'Hello Everybody' }).then((result) => {
        saga
        .provide([
          [matchers.call.fn(createArticle), mockOutputCreateArticle],
        ])
        .withState(storeState)
        .put({type: 'TOKENS_EXPIRED_CHECK'})
        .put(createArticleSuccess({ articles: updatedStoreState , activeArticleNid: page.nid }))
        .dispatch({type: oauthActions.TOKENS_EXPIRED_CHECK_VALID})
        .run()
      });

  });

});
