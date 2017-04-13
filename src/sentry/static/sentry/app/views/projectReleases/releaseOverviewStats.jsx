import React from 'react';
import moment from 'moment';
import {AreaChart, Area, CartesianGrid, ReferenceLine,
        ResponsiveContainer, Tooltip, YAxis, XAxis} from 'recharts';

import ActivityFeed from '../../components/activity/feed';
import ApiMixin from '../../mixins/apiMixin';
import LoadingError from '../../components/loadingError';
import LoadingIndicator from '../../components/loadingIndicator';

const ReleaseOverviewStats = React.createClass({

  mixins: [ApiMixin],

  getInitialState() {
    return {
      data: null,
      loading: true,
      error: false,
    };
  },

  componentDidMount() {
    this.fetchData();
  },

  fetchData() {
    this.api.request(this.getProjectReleaseStatsEndpoint(), {
      success: (data) => {
        this.setState({
          error: false,
          loading: false,
          data: data,
        });
      },
      error: () => {
        this.setState({
          error: true,
          loading: false
        });
      }
    });
  },

  getProjectReleaseStatsEndpoint() {
    let {orgId, projectId} = this.props.params;
    return '/projects/' + orgId + '/' + projectId + '/releases/stats/';
  },

  getActivityEndpoint() {
    let {orgId, projectId} = this.props.params;
    return '/projects/' + orgId + '/' + projectId + '/releases/activity/';
  },

  renderChart() {
    let grays = ['#d3d3d3', '#a8a8a8', '#7e7e7e'];
    let purple = '#8F85D4';
    // just use 30 days for now
    let stats = this.state.data.stats['30d'];
    // filter out releases that have 0 events ever so
    // that tooltip doesn't get crazy
    let releasesWithEvents = new Set();
    stats.forEach(stat => {
      Object.keys(stat[1]).forEach(release => {
        if (stat[1][release] > 0) {
          releasesWithEvents.add(release);
        }
      });
    });
    let data = this.state.data.stats['30d'].map(stat => {
      let point = {
        name: moment(stat[0] * 1000).format('ll'),
      };
      releasesWithEvents.forEach(release => {
        point[release] = stat[1][release];
      });
      return point;
    });
    let deploys = this.state.data.deploys;
    let releases = this.state.data.releases.filter(release => {
      return releasesWithEvents.has(release.version);
    });
    return (
      <ResponsiveContainer minHeight={250}>
        <AreaChart data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip />
          {deploys.map(d => {
            return (
              <ReferenceLine x={moment(d.dateFinished * 1000).format('ll')}
                             label={'Deployed ' + d.release + ' to ' + d.environment}
                             stroke="#2a2a2a" alwaysShow={true}/>
            );
          })}
          {releases.map((release, i) => {
            let color = i === 0 ? purple : grays[i % 3];
            return (
              <Area key={release.version} type="monotone"
                    dataKey={release.version} fill={color}
                    fillOpacity={0.5} stroke={color} stackId="1" />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    );
  },

  renderBody() {
    let body;

    if (this.state.loading) {
      body = <LoadingIndicator />;
    } else if (this.state.error) {
      body = <LoadingError />;
    } else {
      let data = this.state.data;
      body = (
        <div>
          <div className="row">
            <div className="col-sm-3 hidden-xs">
              <div className="release-stats">
                <h6 className="nav-header">Average New Groups Per Release</h6>
                <span className="stream-count">
                  {Math.round(data.AvgNewGroups * 100) / 100}
                </span>
              </div>
            </div>
            <div className="col-sm-3 hidden-xs">
              <div className="release-stats">
                <h6 className="nav-header">Average Number of Authors Per Release</h6>
                <span className="stream-count">
                  {Math.round(data.AvgNumAuthors * 100) / 100}
                </span>
              </div>
            </div>
            <div className="col-sm-3 hidden-xs">
              <div className="release-stats">
                <h6 className="nav-header">Time Between Releases</h6>
                <span className="stream-count">
                  {moment.duration(data.AvgTimeToRelease).humanize()}
                </span>
              </div>
            </div>
            <div className="col-sm-3 hidden-xs">
              <div className="release-stats">
                <h6 className="nav-header">Total Releases</h6>
                <span className="stream-count">{data.CountReleases}</span>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-md-12">
              <h5>Events Per Release</h5>
              {this.renderChart()}
            </div>
          </div>
          <div className="row">
            <div className="col-md-6">
              <ActivityFeed ref="activityFeed" endpoint={this.getActivityEndpoint()} query={{
                per_page: 10,
              }} pagination={false} {...this.props}/>
            </div>
          </div>
        </div>
      );
    }

    return body;
  },

  render() {
    return (
      <div className="release-details">
        {this.renderBody()}
      </div>
    );
  }
});

export default ReleaseOverviewStats;