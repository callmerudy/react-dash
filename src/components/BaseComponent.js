import React, { Component } from 'react';
import EventDispatcher from '../dispatcher/EventDispatcher';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import isString from 'lodash/isString';
import Dataset from '../models/Dataset';
import omit from 'lodash/omit';

export default class BaseComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      dataset: null,
      queryObj: Object.assign({size: 10, from: 0}, this.props.queryObj),
      isFeching: false
    };
  }

  getFetchType() {
    return this.props.fetchData && this.props.fetchData.type;
  }

  componentDidMount(){
    let type = this.getFetchType();

    if(type){

      // fetch data is a function in the subcomponent
      if(type === 'function' && isFunction(this[this.props.fetchData.name])) {
        this.setState({isFeching: true});
        this.fetchData().then(this.onData.bind(this));

      // fetch data is a backend
      } else if(type === 'backend') {
        let dataset = new Dataset(omit(this.props.fetchData, 'type'));
        this.setState({isFeching: true, dataset: dataset});
        dataset.fetch().then(() => {
          this.query(this.state.queryObj);
        });

      // fetch data is an array
      } else if(type === 'inline'){
        this.setData(this.props.fetchData.records);
      }
    }

    // Register to all the actions
    EventDispatcher.register(this.onAction.bind(this));
  }

  onAction() {
    /* IMPLEMENT */
  }

  query(query) {
    if(this.state.dataset) {
      this.state.dataset.query(query).then(this.onData.bind(this));
      this.setState({queryObj: query, isFeching: true});
    } else {
      throw new Error("Missing dataset. You need to use a backend to query against");
    }
  }

  onData(data) {

    // We create a dataset then we can perform queries against.
    if(!this.state.dataset){
      this.state.dataset = new Dataset({records: data});
    }
    this.setData(data);
    this.onDataReady(data);
  }

  onDataReady(data) {
    /* IMPLEMENT */
  }

  fetchData() {
   	return Promise.resolve(this[this.props.fetchData.name]());
  }

  setData(data) {
    let _data = data.hits || data;
    let _total = data.total || data.length;
    this.setState({data: _data, total: _total, isFeching: false});
  }

  emitChange(payload) {
    EventDispatcher.dispatch(payload);
  }
}
