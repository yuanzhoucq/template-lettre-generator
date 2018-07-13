const util = require('util');
const Koa = require('koa');
const fs = require('fs');
const pug = require('pug');
const pdf = require('html-pdf');
const Router = require("koa-router");
const { makeRandomString } = require('./lib');

const app = new Koa();

let router = new Router();

router.get('/template-list', (ctx) => {
  ctx.body = fs.readdirSync('./template').map(f => f.slice(0, -4))
});

router.get('/preview', (ctx) => {
  const body = fs.readFileSync(`./template/${ctx.query.t}.pug`, 'utf-8');
  const variables = body.match(/#{.+?}/g);
  const compiledFunction = pug.compileFile(`./template/${ctx.query.t}.pug`);
  let params = {};
  variables.forEach(v => {
    params[v.slice(2,-1)] = v;
  });
  ctx.body = compiledFunction(params)

});

router.get('/generate', async (ctx) => {

// Compile the source code
  const compiledFunction = pug.compileFile(`./template/${ctx.query.template}.pug`);

// Render a set of data
  const html = compiledFunction(ctx.query);

  const options = {
    format: 'A4',
    border: {
      "top": "1.25cm",
      "right": "2cm",
      "bottom": "1.5cm",
      "left": "2cm"
    }
  };

  const filename = makeRandomString(10);

  const tmp = pdf.create(html, options);
  const toFile = util.promisify(tmp.toFile);

  await toFile.call(tmp, `./static/pdf/${filename}.pdf`);

  ctx.redirect(`./pdf/${filename}.pdf`)

});

app.use(router.routes());

app.use(require('koa-static')('./static'));

app.use(async ctx => {
  ctx.body = 'Hello World';
});

app.listen(3000);