import { JobButton, JobCountComponent } from "./buttons";
import { connect } from "react-redux";
import * as _ from "lodash";

const mapStateToProps = ({ angularProviders }) => angularProviders;

class JobGroupComponent extends React.Component {
    constructor(props) {
        super(props);
        // this.toggleExpanded = this.toggleExpanded.bind(this);
        // this.changeJobSelection = this.changeJobSelection.bind(this);
        // this.groupButtonsAndCounts = this.groupButtonsAndCounts.bind(this);
        // this.selectFirstVisibleJob = this.selectFirstVisibleJob.bind(this);
        // this.selectLastVisibleJob = this.selectLastVisibleJob.bind(this);

        const showDuplicateJobs = this.props.$location.search().duplicate_jobs === 'visible';
        // The group should be expanded initially if the global group state is expanded
        let expanded = this.props.$location.search().group_state === 'expanded';
        // It should also be expanded if the currently selected job is in the group
        // $rootScope.selectedJob will not be set on initial load: attempt to find an ID in the querystring:
        if (!expanded) {
            const selectedJobId = parseInt(this.props.$location.search().selectedJob);
            if (selectedJobId && _.some(this.props.group.jobs, { id: selectedJobId })) {
                expanded = true;
            }
        }
        this.state = {
            expanded,
            showDuplicateJobs
        };

        // Possible "[tier n]" text
        this.tierEl = null;
        if (this.props.group.tier) {
          this.tierEl = <span className="small text-muted">[tier {this.props.group.tier}]</span>;
        }

        this.props.$rootScope.$on(
            this.props.thEvents.duplicateJobsVisibilityChanged,
            () => {
                this.setState({ showDuplicateJobs: !this.state.showDuplicateJobs });
            }
        );

        this.props.$rootScope.$on(
            this.props.thEvents.groupStateChanged,
            (e, newState) => {
                this.setState({ expanded: newState === 'expanded' });
            }
        );

        this.props.$rootScope.$on(
            this.props.thEvents.changeSelection, this.changeJobSelection
        );
    }
    toggleExpanded() {
        this.setState({ expanded: !this.state.expanded });
    }
    // changeJobSelection(e, direction) {
    //     // Ignore job change event if this group has no visible jobs
    //     if (_.isEmpty(this.refs)) return;
    //     const selectedButton = _.find(this.refs, component =>
    //         component.props.job.id === e.targetScope.selectedJob.id);
    //     if (!selectedButton) return;
    //     const index = selectedButton.props.refOrder;
    //
    //     if (direction === 'next' && index + 1 < _.size(this.refs)) {
    //         this.context.selectJob(this.refs[index + 1].props.job);
    //         return;
    //     } else if (direction === 'previous' && index !== 0) {
    //         this.context.selectJob(this.refs[index - 1].props.job);
    //         return;
    //     }
    //     this.context.selectJobFromAdjacentGroup(direction, this);
    // }
    // selectFirstVisibleJob() {
    //     const first = this.refs[Object.keys(this.refs)[0]];
    //     if (first instanceof JobButton) {
    //         this.context.selectJob(first.props.job);
    //     } else {
    //         this.context.selectJobFromAdjacentGroup('next', this);
    //     }
    // }
    // selectLastVisibleJob() {
    //     const refKeys = Object.keys(this.refs);
    //     const last = this.refs[refKeys[refKeys.length - 1]];
    //     if (last instanceof JobButton) {
    //         this.context.selectJob(last.props.job);
    //     } else {
    //         this.context.selectJobFromAdjacentGroup('previous', this);
    //     }
    // }
    groupButtonsAndCounts() {
        let buttons = [];
        const counts = [];
        const stateCounts = {};
        if (this.state.expanded) {
            // All buttons should be shown when the group is expanded
            buttons = this.props.group.jobs;
        } else {
            const typeSymbolCounts = _.countBy(this.props.group.jobs, "job_type_symbol");
            this.props.group.jobs.map((job) => {
                if (!job.visible) return;
                const status = this.props.thResultStatus(job);
                let countInfo = this.props.thResultStatusInfo(status, job.failure_classification_id);
                if (['testfailed', 'busted', 'exception'].includes(status) ||
                    (typeSymbolCounts[job.job_type_symbol] > 1 && this.state.showDuplicateJobs)) {
                    // render the job itself, not a count
                    buttons.push(job);
                } else {
                    const lastJobSelected = {};
                    countInfo = { ...countInfo, ...stateCounts[countInfo.btnClass] };
                    if (!_.isEmpty(lastJobSelected.job) && (lastJobSelected.job.id === job.id)) {
                        countInfo.selectedClasses = ['selected-count', 'btn-lg-xform'];
                    } else {
                        countInfo.selectedClasses = [];
                    }
                    if (stateCounts[countInfo.btnClass]) {
                        countInfo.count = stateCounts[countInfo.btnClass].count + 1;
                    } else {
                        countInfo.count = 1;
                    }
                    countInfo.lastJob = job;
                    stateCounts[countInfo.btnClass] = countInfo;
                }
            });
            Object.entries(stateCounts).forEach(([, countInfo ]) => {
                if (countInfo.count === 1) {
                    buttons.push(countInfo.lastJob);
                } else {
                    counts.push(countInfo);
                }
            });
        }
        return { buttons, counts };
    }
    render() {
        const items = this.groupButtonsAndCounts();
        const buttons = items.buttons.map((job, i) => (
            <JobButton job={job}
                       hasGroup={true}
                       key={job.id}
                       ref={i}
                       refOrder={i} />
        ));
        const counts = items.counts.map(countInfo => (
            <JobCountComponent count={countInfo.count}
                               onClick={this.toggleExpanded}
                               className={`${countInfo.btnClass}-count`}
                               title={`${countInfo.count} ${countInfo.countText} jobs in group`}
                               key={countInfo.lastJob.id}
                               countKey={countInfo.lastJob.id} />
        ));
        return (
          <span className="platform-group">
            <span className="disabled job-group"
                  title={this.props.group.name}
                  data-grkey={this.props.group.grkey}>
              <button className="btn group-symbol"
                      data-ignore-job-clear-on-click={true}
                      onClick={this.toggleExpanded}>{this.props.group.symbol}{this.tierEl}</button>

              <span className="group-content">
                <span className="group-job-list">
                  {buttons}
                </span>
                <span className="group-count-list">
                  {counts}
                </span>
              </span>
            </span>
          </span>
        );
    }
}

export const JobGroup = connect(mapStateToProps)(JobGroupComponent);
