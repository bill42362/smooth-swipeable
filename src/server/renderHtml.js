// renderHtml.js
import serialize from 'serialize-javascript';
import packageConfig from '../../package.json';
import envConfig from '../../config.json';

const shouldHaveBase = envConfig.USE_ABSOLUTE_ROUTE;

const defaultHelmet = {
  htmlAttributes: '',
  meta: `
    <meta data-react-helmet=true charset=utf-8/>
    <meta data-react-helmet=true name=viewport content="width=device-width, initial-scale=1"/>
    <meta data-react-helmet=true name=author content="${packageConfig.description}"/>
    <meta data-react-helmet=true name=description content="${packageConfig.description}"/>
    <meta data-react-helmet=true property=og:url content="${envConfig.URL}"/>
    <meta data-react-helmet=true property=og:type content=website/>
    <meta data-react-helmet=true property=og:title content="${packageConfig.name}"/>
    <meta data-react-helmet=true property=og:description content="${packageConfig.description}"/>
    <meta data-react-helmet=true property=og:site_name content="${packageConfig.name}"/>
    <meta data-react-helmet=true property=app:version content="${packageConfig.version}"/>
  `,
  title: `<title data-react-helmet=true>${packageConfig.name}</title>`,
  link: '',
  script: '',
};

export const renderHtml = ({
  request,
  helmet = defaultHelmet,
  faviconTags,
  styleTags,
  jsTags,
}) => {
  return new Promise(resolve => {
    resolve({
      html: `
        <!doctype html>
        <html ${helmet.htmlAttributes.toString()}>
        <head>
          ${shouldHaveBase ? `<base href="${envConfig.URL}" />` : ''}
          ${helmet.meta.toString()}
          ${
            !!faviconTags
              ? `
                <meta
                  data-react-helmet=true
                  property=og:image
                  content="${faviconTags.replace(
                    /^.*href="(\S*1536\S*)".*$/,
                    '$1'
                  )}"
                />
                <meta data-react-helmet=true property=og:image:width content=1536 />
                <meta data-react-helmet=true property=og:image:height content=2008 />
              `
              : ''
          }
          ${helmet.title.toString()}
          ${helmet.link.toString()}
          ${helmet.script.toString()}
          ${faviconTags || ''}
          ${styleTags || ''}
        </head>
        <body>
          <div id=app-root></div>
          <div id=modal-root></div>
          ${jsTags}
        </body>
        </html>
      `,
    });
  });
};

export default renderHtml;
