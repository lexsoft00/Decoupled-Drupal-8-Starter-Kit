import React, {Component} from 'react';

import { ApolloProvider } from 'react-apollo';

import {UploadComponent} from './components/index';

import CreateSelect from './components/CreateSelect';
import SignIn from './components/SignIn';
import Navbar from './components/Navbar';

import { connect } from 'react-redux';

export class App extends Component {

  renderLoading = () => {
    return (
      <div>Loading...</div>
    );
  }

  renderAuthenticated = () => {
    const {client,handleLogout, username, uuid, uid, nid, mids,apolloclient } = this.props;

    return (
      <ApolloProvider client={client}>
        <div className="container authenticated">
            <Navbar handleLogout={handleLogout} />
            {
              !this.props.nid ?
                <CreateSelect projectCreateSelectHandler={this.props.projectCreateSelectHandler}/>
              :
                <UploadComponent username={username} uid={uid} uuid={uuid} nid={nid} mids={mids} />
            }
        </div>
      </ApolloProvider>
    );
  }

  renderAnonymous = () => {
    const {handleInputChange, handleLogin, isLoginFailed} = this.props;
    return <SignIn handleInputChange={handleInputChange} handleLogin={handleLogin} isLoginFailed={isLoginFailed} />;
  }

  renderError = () => {
    return (
      <div>Sadly, there seems to have been an error. Contact someone super important to help facilitate forward progress.</div>
    )
  }

  render() {
    if (this.props.isLoading) {
      return this.renderLoading();
    } else if (this.props.isAuthenticated){
      return this.renderAuthenticated();
    } else if (!this.props.isAuthenticated && !this.props.isLoading) {
      return this.renderAnonymous();
    } else {
      return this.renderError();
    }
  }

}
const mapStateToProps = (state, ownProps) => ({
  apolloclient: state.apollo.apolloClient
})

export default connect(mapStateToProps)(App);
