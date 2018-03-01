import React from "react";
import Link from "gatsby-link";
import Helmet from "react-helmet";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

const sectionIs = desiredSection => ({ sectionId }) =>
  sectionId === desiredSection;

function PageList({ navs, location }) {
  return (
    <ul className="page-list nav flex-column mb5">
      {navs.map(({ to, title }, idx) =>
        <li key={idx} className="f6 lh-copy pv1">
          <Link
            className={`nav-link ${location.pathname === to ? "active" : ""}`}
            to={to}
          >
            {title}
          </Link>
        </li>
      )}
    </ul>
  );
}

const Page = ({
  data: { remark: { html, frontmatter: { title } }, nav },
  location,
}) => {
  const [, navSection] = location.pathname.split("/");
  const thisNavEdge = nav.edges.find(
    ({ node: { name } }) => name === navSection
  );
  const thisNav = (thisNavEdge && thisNavEdge.node) || {
    pages: [],
    sections: [],
  };
  const navPages = thisNav.pages;
  const navSections = thisNav.sections || [];
  const currentIndex = navPages.findIndex(({ to }) => to === location.pathname);
  let next, nextText, prev, prevText;
  if (currentIndex > 0) {
    prev = navPages[currentIndex - 1].to;
    prevText = navPages[currentIndex - 1].title;
  }
  if (currentIndex >= 0 && currentIndex < navPages.length - 1) {
    next = navPages[currentIndex + 1].to;
    nextText = navPages[currentIndex + 1].title;
  }
  const isPostGraphileDocs = navSection === "postgraphile";

  return (
    <div className="template-page">
      <Helmet
        title={`Graphile | ${title}`}
        meta={[
          {
            name: "description",
            content: "Utilities to build powerful and performant GraphQL APIs",
          },
          {
            name: "keywords",
            content:
              "GraphQL, API, Graph, PostgreSQL, PostGraphQL, server, plugins, introspection, reflection",
          },
        ]}
      />
      {isPostGraphileDocs
        ? <div className="header-notice pv3 ph3 f5 lh-title bg-near-black moon-gray">
            <div className="container">
              <div className="row">
                <div className="col-xs-12">
                  <strong>NOTICE</strong>: PostGraphQL has been <Link
                    to="/history">renamed to PostGraphile</Link>.  If you were
                  using <code>postgraphql@next</code> you should update to{" "}
                  <code>postgraphile</code> instead as{" "}
                  <code>postgraphql@next</code> will not receive any further
                  updates.
                </div>
              </div>
            </div>
          </div>
        : null}
      <SiteHeader location={location} />
      <div className="page-content">
        <section>
          <div className="container">
            <div className="row between-xs">
              <aside className="sidebar col-xs-12 col-md-3 last-xs mt3">
                {navSections.map(({ id, title }, idx) =>
                  <section key={idx}>
                    <h4 className="f6 ttu fw6 mt0 mb3 bb pb2">
                      {title}
                    </h4>
                    <div className="nested-list-reset">
                      <PageList
                        location={location}
                        navs={navPages.filter(sectionIs(id))}
                      />
                    </div>
                  </section>
                )}
              </aside>
              <div className="col-xs-12 col-md-9 first-xs main-content">
                <div className="row">
                  <div
                    className="col-xs-12"
                    dangerouslySetInnerHTML={{ __html: html }}
                    style={{ width: "100%" }}
                  />
                  <br />
                  <br />
                  <div className="col-xs-12 mt3 mb5">
                    <div className="row between-xs">
                      <div className="col-xs-6">
                        {prev
                          ? <Link className="" to={prev}>
                              <span className="fa fa-fw fa-long-arrow-left" />{" "}
                              {prevText || "Previous"}
                            </Link>
                          : null}
                      </div>
                      <div className="col-xs-6 tr">
                        {next
                          ? <Link className="" to={next}>
                              {nextText || "Next"}{" "}
                              <span className="fa fa-fw fa-long-arrow-right" />
                            </Link>
                          : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <SiteFooter />
    </div>
  );
};

export default Page;

export const pageQuery = graphql`
  query PageByPath($path: String!) {
    remark: markdownRemark(frontmatter: { path: { eq: $path } }) {
      html
      frontmatter {
        path
        title
      }
    }
    nav: allNavJson {
      edges {
        node {
          id
          name
          sections {
            id
            title
          }
          pages {
            to
            title
            sectionId
          }
        }
      }
    }
  }
`;
