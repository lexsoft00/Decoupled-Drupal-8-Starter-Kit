import { call, put, take, takeLatest } from 'redux-saga/effects';
import Querystring from 'query-string';
import axios from 'axios';

import {
  ACTIONS as OAUTH_ACTIONS,
  loginSuccess,
  loginFailure,
  // refreshTokensRequest,
  tokensExpiredCheckValid,
  // tokensExpiredCheckNotValid,
  refreshTokensRequestSuccess,
  refreshTokensRequestFailure,
  refreshTokensRequest,
} from './actions';

import {
  ACTIONS as CSRF_ACTIONS,
  initCsrfToken,
} from '../csrf/actions';

import { generateCredentials, isTokenValid, getLocalCredentials } from './utilities';

const URL = process.env.REACT_APP_HOST_DOMAIN;
const POSTFIX = process.env.REACT_APP_XDEBUG_POSTFIX;


const fetchToken = credentials => axios.post(`${URL}/oauth/token${POSTFIX}`, Querystring.stringify(credentials))
  .then((response) => {
      const { expires_in, access_token, refresh_token } = response.data; // eslint-disable-line
    return ({
      expiration: expires_in,
      accessToken: access_token,
      refreshToken: refresh_token,
      timestamp: new Date().getTime(),
    });
  }).catch((error) => {
    console.log(error);
    return error;
  });


function* loginRequestSaga(action) {
  console.log(action.type);
  const { username, password } = action.payload;
  const credentials = generateCredentials('password', username, password, '');

  try {
    const result = yield call(fetchToken, credentials);
    result.username = username;
    if (result.accessToken) {
      yield put(loginSuccess(result));
    } else {
      yield put(loginFailure(result));
    }
  } catch (error) {
    yield put(loginFailure(error));
  }
}

function* refreshTokensRequestSaga(action) {
  console.log(action.type);
  const { refreshToken } = action.payload;
  const username = sessionStorage.getItem('username');
  const credentials = generateCredentials('refresh_token', username, '', refreshToken);

  try {
    const result = yield call(fetchToken, credentials);
    result.username = username;
    if (result.accessToken) {
      console.log('REFRESH TOKEN SUCCESS');
      yield put(refreshTokensRequestSuccess(result));
    } else {
      console.log('REFRESH TOKEN FAILURE');
      yield put(refreshTokensRequestFailure(result));
    }
  } catch (error) {
    console.log('REFRESH TOKEN FAILURE');
    yield put(refreshTokensRequestFailure(error));
  }
}


function* tokenExpiredCheckSaga(action) {
  console.log(action.type);
  const {
    csrfToken, accessToken, expireStamp, refreshToken,
  } = getLocalCredentials();

  if (!csrfToken) {
    yield put(initCsrfToken());
    yield take(CSRF_ACTIONS.CSRF_TOKEN_SUCCESS, tokenExpiredCheckSaga);
  }

  if (accessToken && expireStamp) {
    if (!isTokenValid(accessToken, expireStamp)) {
      try {
        console.log('REFRESH TOKEN IS NOT VALID');
        yield put(refreshTokensRequest({ refreshToken }));
      } catch (e) {
        console.log(e);
      }
    } else {
      console.log('REFRESH TOKEN IS VALID');
      yield put(tokensExpiredCheckValid());
    }
  }
}

export function* watchOAuth() {
  yield takeLatest(OAUTH_ACTIONS.LOGIN_REQUEST, loginRequestSaga);
  yield takeLatest(OAUTH_ACTIONS.REFRESH_TOKENS_REQUEST, refreshTokensRequestSaga);
  yield takeLatest(OAUTH_ACTIONS.TOKENS_EXPIRED_CHECK, tokenExpiredCheckSaga);
}

export default watchOAuth;
