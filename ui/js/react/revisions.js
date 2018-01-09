import PropTypes from 'prop-types';

const moreRevisionsLinkComponent = props => React.DOM.li(
    null,
    React.DOM.a(
        {
            href: props.href,
            'data-ignore-job-clear-on-click': true,
            target: '_blank'
        },
        '\u2026and more',
        React.DOM.i({ className: 'fa fa-external-link-square', key: 'more' })
    )
);
moreRevisionsLinkComponent.propTypes = {
    href: PropTypes.string.isRequired
};

var revisionItemComponent = (props) => {
    var name, email, initialsHTML, comment, escapedCommentHTML, tags, userTokens;
    var $filter = props.$injector.get('$filter');

    userTokens = props.revision.author.split(/[<>]+/);
    name = userTokens[0].trim();
    if (userTokens.length > 1) email = userTokens[1];
    initialsHTML = { __html: $filter('initials')(name) };

    comment = _.escape(props.revision.comments.split('\n')[0]);
    escapedCommentHTML = { __html: $filter('linkifyBugs')(comment) };

    tags = "";
    if (comment.search("Backed out") >= 0 ||
        comment.search("Back out") >= 0) {
        tags += "backout ";
    }
    tags = tags.trim();
    return React.DOM.li(
        {
            className: 'clearfix',
            key: props.revision.revision
        },
        React.DOM.span(
            {
                className: 'revision',
                'data-tags': tags
            },
            React.DOM.span(
                { className: 'revision-holder' },
                React.DOM.a(
                    {
                        title: `Open revision ${props.revision.revision} on ${props.repo.url}`,
                        href: props.repo.getRevisionHref(props.revision.revision),
                        'data-ignore-job-clear-on-click': true
                    },
                    props.revision.revision.substring(0, 12)
                )),
            React.DOM.span({
                title: `${name}: ${email}`,
                dangerouslySetInnerHTML: initialsHTML
            }),
            React.DOM.span(
                { title: comment },
                React.DOM.span(
                    { className: 'revision-comment' },
                    React.DOM.em({ dangerouslySetInnerHTML: escapedCommentHTML })
                )
            )
        )
    );
};
revisionItemComponent.propTypes = {
    $injector: PropTypes.object.isRequired,
    revision: PropTypes.object.isRequired,
    repo: PropTypes.object.isRequired,
};

var revisionListComponent = (props) => {
    var moreLink = null;
    if (props.resultset.revision_count > props.resultset.revisions.length) {
        moreLink = moreRevisionsLinkComponent({
            href: props.repo.getPushLogHref(props.resultset.revision)
        });
    }
    return React.DOM.span(
        { className: 'revision-list col-5' },
        React.DOM.ul(
            { className: 'list-unstyled' },
            props.resultset.revisions.map(revision =>
                revisionItemComponent({
                    revision,
                    $injector: props.$injector,
                    repo: props.repo
                })
            ),
            moreLink
        )
    );
};
revisionListComponent.propTypes = {
    resultset: PropTypes.object.isRequired,
    repo: PropTypes.object.isRequired,
    $injector: PropTypes.object.isRequired,
};
