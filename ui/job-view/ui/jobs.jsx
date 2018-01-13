import React from 'react';
import PropTypes from 'prop-types';
import { RevisionList } from './revisions';
import { JobGroup } from './groups';
import { JobButton } from './buttons';
import { connect, Provider } from "react-redux";
import { store } from '../redux/store';
import * as aggregateIds from '../aggregateIds';
import { platformMap } from "../../js/constants";
import * as angularProviders from "../redux/modules/angularProviders";
import * as pushes from "../redux/modules/pushes";
import * as _ from 'lodash';

const JobPlatformDataComponent = (props) => {
    const titleText = `${props.platform.name} ${props.platform.option}`;
    return (
        <td className='platform'>
            <span title="`${titleText}`">{titleText}</span>
        </td>
    );
};
JobPlatformDataComponent.propTypes = {
    platform: PropTypes.object.isRequired
};

class JobDataComponent extends React.PureComponent {
    constructor(props) {
        super(props);
        this.selectJobFromAdjacentGroup = this.selectJobFromAdjacentGroup.bind(this);
        this.selectFirstVisibleJob = this.selectFirstVisibleJob.bind(this);
        this.selectLastVisibleJob = this.selectLastVisibleJob.bind(this);
    }
    // getChildContext() {
    //     return {
    //         selectJobFromAdjacentGroup: this.selectJobFromAdjacentGroup
    //     };
    // }
    selectJobFromAdjacentGroup(direction, src) {
        const index = src.props.refOrder;
        if (direction === 'next') {
            let nextIndex = index + 1;
            if (nextIndex === _.size(this.refs)) {
                // This is the last group in its platform
                // Select first job in the next platform
                this.context.selectJobFromAdjacentPlatform(direction, src);
            } else if (this.refs[nextIndex] instanceof JobButton) {
                this.context.selectJob(this.refs[nextIndex].props.job);
            } else {
                // Find the next group with visible buttons and select its first button
                while (nextIndex < _.size(this.refs) && _.isEmpty(this.refs[nextIndex].refs)) {
                    nextIndex++;
                }
                if (nextIndex < _.size(this.refs)) {
                    this.refs[nextIndex].selectFirstVisibleJob();
                } else {
                    this.context.selectJobFromAdjacentPlatform(direction, src);
                }
            }
        } else if (index === 0) {
            // No more previous groups left in this platform
            // Select last job in previous platform
            this.context.selectJobFromAdjacentPlatform(direction, src);
        } else {
            let previousIndex = index - 1;
            if (this.refs[previousIndex] instanceof JobButton) {
                this.context.selectJob(this.refs[previousIndex].props.job);
            } else {
                // Search refs for a previous group with visible buttons
                // or a previous standalone job button
                var previousJobOrGroup = this.refs[previousIndex];
                while (previousJobOrGroup &&
                (_.isEmpty(previousJobOrGroup.refs)) &&
                !(previousJobOrGroup instanceof JobButton)) {
                    previousJobOrGroup = this.refs[--previousIndex];
                }
                if (previousJobOrGroup instanceof JobGroup) {
                    previousJobOrGroup.selectLastVisibleJob();
                } else if (previousJobOrGroup instanceof JobButton) {
                    this.context.selectJob(previousJobOrGroup.props.job);
                } else {
                    this.context.selectJobFromAdjacentPlatform(direction, src);
                }
            }
        }
    }
    selectFirstVisibleJob() {
        const first = this.refs[Object.keys(this.refs)[0]];
        if (first instanceof JobButton) {
            this.context.selectJob(first.props.job);
        } else if (first instanceof JobGroup) {
            first.selectFirstVisibleJob();
        }
    }
    selectLastVisibleJob() {
        var refKeys = Object.keys(this.refs);
        var last = this.refs[refKeys[refKeys.length - 1]];
        if (last instanceof JobButton) {
            this.context.selectJob(last.props.job);
        } else if (last instanceof JobGroup) {
            last.selectLastVisibleJob();
        }
    }
    render() {
      return (
        <td className="job-row">
          { this.props.groups.map((group, i) => {
            if (group.symbol !== '?') {
              return (
                <JobGroup group={group}
                          refOrder={i}
                          key={group.mapKey}
                          ref={i}/>
              );
            }
            return (
              group.jobs.map(job => (
                <JobButton job={job}
                           key={job.id}
                           hasGroup={false}
                           ref={i}
                           refOrder={i}/>
              ))
            );
          })}
        </td>
      );
    };
}

class JobTableRowComponent extends React.PureComponent {

  render() {
    return (
      <tr id={this.props.platform.id}
          key={this.props.platform.id}>

        <JobPlatformDataComponent platform={this.props.platform} />
        <JobDataComponent groups={this.props.platform.groups}
                          ref="data"/>
      </tr>
    );
  }
}

const SpinnerComponent = () => (
  <span className="fa fa-spinner fa-pulse th-spinner" />
);

const mapJobTableStateToProps = ({ angularProviders, pushes }) => ({
  ...angularProviders,
  ...pushes,
});

class JobTableComponent extends React.Component {
  constructor(props) {
    super(props);

    // Check for a selected job in the result set store
    let selectedJobId = null;
    let selectedJobObj = this.props.ThResultSetStore.getSelectedJob(this.props.$rootScope.repoName);
    if (_.isEmpty(selectedJobObj.job)) {
      // Check the URL
      const jobId = this.props.$location.search().selectedJob;
      if (jobId) {
        selectedJobId = parseInt(jobId);
      }
    } else {
      selectedJobId = selectedJobObj.job.id;
    }
    this.state = {
      // platforms: {},
      // jobsLoaded: false,
      selectedJobId
    };

    this.rsMap = null;
    this.pushId = this.props.push.id;
    this.aggregateId = aggregateIds.getResultsetTableId(
      this.props.$rootScope.repoName,
      this.pushId,
      this.props.push.revision
    );

    this.filterJobs = this.filterJobs.bind(this);
    this.selectJob = this.selectJob.bind(this);
    this.selectJobFromAdjacentPlatform = this.selectJobFromAdjacentPlatform.bind(this);

    this.props.$rootScope.$on(
      this.props.thEvents.applyNewJobs,
      (ev, appliedpushId) => {
        if (appliedpushId !== this.pushId) return;
        this.rsMap = this.props.ThResultSetStore.getResultSetsMap(this.props.$rootScope.repoName);
        const platforms = this.props.platforms[this.pushId] || {};
        this.rsMap[this.pushId].rs_obj.platforms.forEach((platform) => {
          platform.id = this.getIdForPlatform(platform);
          platform.name = platformMap[platform.name] || platform.name;
          platform.groups.forEach((group) => {
            if (group.symbol !== '?') {
              group.grkey = group.mapKey;
            }
          });
          platforms[platform.id] = this.filterPlatform(platform);
        });
        console.log("got new jobs");
        // store.dispatch(pushes.actions.storeJobsLoaded(this.pushId, true));
        // console.log("storePlatforms", platforms);
        store.dispatch(pushes.actions.storePlatforms(this.pushId, platforms));
        // this.setState({ platforms, jobsLoaded: true });
      }
    );

    this.props.$rootScope.$on(
      this.props.thEvents.globalFilterChanged, this.filterJobs
    );

    this.props.$rootScope.$on(
      this.props.thEvents.searchPage, this.filterJobs
    );

    this.props.$rootScope.$on(
      this.props.thEvents.groupStateChanged, this.filterJobs
    );

    this.props.$rootScope.$on(
      this.props.thEvents.searchPage, this.filterJobs
    );
  }

  getIdForPlatform(platform) {
    return aggregateIds.getPlatformRowId(
      this.props.$rootScope.repoName,
      this.props.push.id,
      platform.name,
      platform.option
    );
  }

  getPlatformIdForJob(job) {
    return aggregateIds.getPlatformRowId(
      this.props.$rootScope.repoName,
      this.props.push.id,
      job.platform,
      job.platform_option
    );
  }

  selectJob(job) {
    // Delay switching jobs right away, in case the user is switching rapidly between jobs
    if (this.jobChangedTimeout) {
      window.clearTimeout(this.jobChangedTimeout);
    }
    this.jobChangedTimeout = window.setTimeout(() => {
      this.props.$rootScope.$emit(
        this.props.thEvents.jobClick, job
      );
      this.props.ThResultSetStore.setSelectedJob(
        this.props.$rootScope.repoName, job
      );
    }, 200);
  }

  selectJobFromAdjacentPlatform(direction, src) {
    if (src.context.pushId !== this.props.push.id) return;
    var platformId = src.context.platform.id;
    var selectedPlatform = this.refs[platformId];
    if (!selectedPlatform) return;
    var index = selectedPlatform.props.refOrder;
    index = direction === 'next' ? index + 1 : index - 1;
    var targetPlatform = _.find(this.refs, component => component.props.refOrder === index);
    if (direction === 'next') targetPlatform.refs.data.selectFirstVisibleJob();
    else targetPlatform.refs.data.selectLastVisibleJob();
  }

  filterJobs() {
    if (_.isEmpty(this.props.platforms)) return;
    const platforms = _.cloneDeep(this.props.platforms[this.pushId]);
    _.forEach(platforms, (platform) => {
      platforms[platform.id] = this.filterPlatform(platform);
    });
    store.dispatch(pushes.actions.storePlatforms(this.pushId, platforms));
  }

  filterPlatform(platform) {
    platform.visible = false;
    platform.groups.forEach((group) => {
      group.visible = false;
      group.jobs.forEach((job) => {
        job.visible = this.props.thJobFilters.showJob(job);
        if (this.rsMap && job.state === 'runnable') {
          job.visible = job.visible &&
            this.rsMap[job.result_set_id].rs_obj.isRunnableVisible;
        }
        job.selected = job.id === this.state.selectedJobId;
        if (job.visible) {
          platform.visible = true;
          group.visible = true;
        }
      });
    });
    return platform;
  }

  render() {
    const platforms = this.props.platforms[this.pushId] || {};
    return (
      <table id={this.aggregateId} className="table-hover">
        <tbody>
          {platforms ? Object.keys(platforms).map((id, i) => (
            // this.props.platforms[this.pushId][id].visible &&
              <JobTableRowComponent platform={ platforms[id] }
                                    key={ id }
                                    ref={ id }
                                    refOrder={ i } />
            )) : <tr><td><SpinnerComponent /></td></tr> }
        </tbody>
      </table>
    );
  }
}

const mapStateToProps = ({ angularProviders }) => angularProviders;

class PushComponent extends React.Component {
  constructor(props) {
    super(props);
    // console.log("Push props", this.props);
    store.dispatch(angularProviders.actions.storeProviders(this.props.$injector));

    this.state = {
      showRevisions: this.props.$rootScope.showRevisions
    };

    this.aggregateId = aggregateIds.getResultsetTableId(
      this.props.$rootScope.repoName, this.props.push.id, this.props.push.revision
    );
  }

  render() {
    const containerClasses = ['job-list'];
    if (this.state.showRevisions) {
      containerClasses.push('job-list-pad', 'col-7');
    } else {
      containerClasses.push('job-list-nopad', 'col-12');
    }

    return (
      <Provider store={store}>
      <div className="row result-set clearfix">
        {this.state.showRevisions ? <RevisionList resultset={this.props.push}
                                                  repo={this.props.$rootScope.currentRepo} />
                                  : null }
        <span className={ containerClasses.join(' ') }>
          <JobTable push={this.props.push} />
        </span>
      </div>
      </Provider>
    );
  }
}

treeherder.directive('push', ['reactDirective', '$injector', (reactDirective, $injector) =>
  reactDirective(connect(mapStateToProps)(PushComponent), ['push'], {}, { $injector, store })]);

export const JobTable = connect(mapJobTableStateToProps)(JobTableComponent);
