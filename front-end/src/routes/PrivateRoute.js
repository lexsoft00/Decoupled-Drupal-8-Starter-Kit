import React from 'react';
// import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Route } from 'react-router';
import { Redirect } from 'react-router-dom';

import { graphql, compose } from 'react-apollo';
import { AUTHENTICATED_QUERY } from '../api/apolloProxy';

const RedirectToLogin = () => (<Redirect to={{ pathname: '/login' }} />);

const PrivateRouteContainer = props => (
  <Route
    {...props}
    component={props.data.authenticated.isAuthenticated || props.isLoggingIn ?
      props.component :
      RedirectToLogin}
  />
);

// PrivateRouteContainer.propTypes = {
//   isAuthenticated: PropTypes.bool.isRequired,
//   isLoggingIn: PropTypes.bool.isRequired,
//   component: PropTypes.func.isRequired,
// };

// const PrivateRoute = connect(state => ({
//   isAuthenticated: state.authReducer.isAuthenticated,
//   isLoggingIn: state.authReducer.isLoggingIn,
// }))(PrivateRouteContainer);

export default compose(graphql(AUTHENTICATED_QUERY))(PrivateRouteContainer);
