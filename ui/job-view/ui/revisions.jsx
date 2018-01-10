import PropTypes from 'prop-types';

const MoreRevisionsLink = props => (
    <li>
        <a href={props.href}
           data-ignore-job-clear-on-click={true}
           target="_blank">
            {`\u2026and more`}
            <i className="fa fa-external-link-square" />
        </a>
    </li>
);

MoreRevisionsLink.propTypes = {
    href: PropTypes.string.isRequired
};

const Initials = (props) => {
    const str = props.author || '';
    const words = str.split(' ');
    const firstLetters = _.map(
        words,
        word => word.replace(/[^A-Z]/gi, '')[0]
    ).filter(firstLetter => typeof firstLetter !== 'undefined');
    let initials = "";

    if (firstLetters.length === 1) {
        initials = firstLetters[0];
    } else if (firstLetters.length > 1) {
        initials = firstLetters[0] + firstLetters[firstLetters.length - 1];
    }

    return (
        <span>
            <span className="user-push-icon" title={props.title}>
                <i className="fa fa-user-o" aria-hidden="true" />
            </span>
            <div className="icon-superscript user-push-initials">{initials}</div>
        </span>
    );
};

const RevisionItem = (props) => {
    let email, name, userTokens, escapedComment, escapedCommentHTML, tags;

    userTokens = props.revision.author.split(/[<>]+/);
    name = userTokens[0].trim().replace(/\w\S*/g,
                                        txt => txt.charAt(0).toUpperCase() + txt.substr(1));

    if (userTokens.length > 1) email = userTokens[1];
    const comment = props.revision.comments.split('\n')[0];

    escapedComment = _.escape(comment);
    escapedCommentHTML = { __html: props.linkifyBugsFilter(escapedComment) };

    tags = '';
    if (escapedComment.search("Backed out") >= 0 ||
        escapedComment.search("Back out") >= 0) {
        tags += "backout";
    }

    return <li className="clearfix">
        <span className="revision" data-tags={tags}>
            <span className="revision-holder">
                <a title={`Open revision ${props.revision.revision} on ${props.repo.url}`}
                   href={props.repo.getRevisionHref(props.revision.revision)}
                   data-ignore-job-clear-on-click>
                    {props.revision.revision.substring(0, 12)}
                </a>
            </span>
            <Initials title={`${name}: ${email}`}
                      author={name} />
            <span title={comment}>
                <span className="revision-comment">
                    <em dangerouslySetInnerHTML={escapedCommentHTML} />
                </span>
            </span>
        </span>
    </li>;
};
RevisionItem.propTypes = {
    revision: PropTypes.object.isRequired,
    repo: PropTypes.object.isRequired,
    linkifyBugsFilter: PropTypes.func.isRequired,
    initialsFilter: PropTypes.func.isRequired
};

export const RevisionList = (props) => {
    const linkifyBugsFilter = props.$injector.get('$filter')('linkifyBugs');
    const hasMore = props.resultset.revision_count > props.resultset.revisions.length;
    return (
        <span className="revision-list col-5">
            <ul className="list-unstyled">
                {props.resultset.revisions.map((revision, i) =>
                    <RevisionItem
                        linkifyBugsFilter={linkifyBugsFilter}
                        revision={revision}
                        repo={props.repo}
                        key={i} />
                )}
                {hasMore &&
                    <MoreRevisionsLink
                        key="more"
                        href={props.repo.getPushLogHref(props.resultset.revision)} />
                }
            </ul>
        </span>
    );
};
RevisionList.propTypes = {
    resultset: PropTypes.object.isRequired,
    repo: PropTypes.object.isRequired,
    $injector: PropTypes.object.isRequired
};