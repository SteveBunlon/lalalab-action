import type { SslMode } from '@forestadmin/datasource-sql';
import type { Schema } from './typings';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { createAgent } from '@forestadmin/agent';
import { createSqlDataSource } from '@forestadmin/datasource-sql';
import fs from 'fs';
import * as path from "path";

// This object allows to configure your Forest Admin panel
const agent = createAgent<Schema>({
  // Security tokens
  authSecret: process.env.FOREST_AUTH_SECRET!,
  envSecret: process.env.FOREST_ENV_SECRET!,
  forestServerUrl: process.env.FOREST_SERVER_URL!,

  // Make sure to set NODE_ENV to 'production' when you deploy your project
  isProduction: process.env.NODE_ENV === 'production',

  // Autocompletion of collection names and fields
  typingsPath: './typings.ts',
  typingsMaxDepth: 5,
  loggerLevel: "Debug"
});

// Connect your datasources
// All options are documented at https://docs.forestadmin.com/developer-guide-agents-nodejs/data-sources/connection
agent.addDataSource(
  createSqlDataSource({
    uri: process.env.DATABASE_URL,
    schema: process.env.DATABASE_SCHEMA,
    sslMode: process.env.DATABASE_SSL_MODE as SslMode,
  }),
);

agent.customizeCollection('owners', collection => {

  collection.addField('reasons', {
    dependencies: ['id'],
    columnType: 'Json',
    getValues: (records, context) => {
      const data = []

      if (records.length === 1) {
        const reasons = {
          1: 'wrong',
          2: 'incomplete',
          3: 'canceled',
        }
        const formattedReasons = Object.entries(reasons).map(([index, value]) => {
          return { name: value, value: index }
        })

        data.push(formattedReasons)
      }

      return data;
    }
  })

  collection.addField('thumbs', {
    columnType: [{
      uuid: 'Number',
      thumbs: ['String'],
    }],
    dependencies: ['id'],
    getValues: (records, context) => {
      const data = [];

      if (records.length === 1) {
        data.push([{
          uuid: 1,
          thumbs: ['https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg', 'https://img.freepik.com/free-photo/purple-osteospermum-daisy-flower_1373-16.jpg']
        }, {
          uuid: 2,
          thumbs: ['https://cdn.pixabay.com/photo/2012/04/12/23/47/car-30984_640.png']
        }])
      }

      return data;
    }
  })

  collection.addField('extraInfo', {
    dependencies: ['id', 'thumbs'],
    columnType: 'Json',
    getValues(records, context ) {
      const data = [];

      if (records.length === 1) {
        const record = records[0];
        data.push({
          value1: 'test',
          value2: 'test2',
          items: [{
            check: true,
            uuid: 1,
            label: 'Flower',
            thumbs: [],
            quantity: Math.round(Math.random() * 100),
          }, {
            check: false,
            uuid: 2,
            label: 'Car',
            thumbs: [],
            quantity: Math.round(Math.random() * 100),
          }]
        })

        data[0].items.forEach(item => {
          item.thumbs = record.thumbs.find(thumb => thumb.uuid === item.uuid).thumbs;
        })
      }

      return data;
    }
  })

  collection.addAction('Lalalab-test', {
    scope: 'Single',
    execute: (context, resultBuilder) => {
      console.log(context);
      return resultBuilder.success('Working');
    }
  })
})

const app = express();

// This is mandatory otherwise chrome breaks. Cors are correctly configured for the agent routes, not for the public ones
app.use(cors({
  origin: ['https://app.development.forestadmin.com', 'https://app.forestadmin.com'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}))

// Start the agent.
agent.mountOnExpress(app).start()

app.listen(process.env.APPLICATION_PORT, () => {
  console.log(`Server is running on port ${process.env.APPLICATION_PORT}`);
});
// Super hard to understand what's inside the parameters (the doc does not say enough, it says component of type model but that's not enough)
// On agent nodejs, people will be forced to instanciate an express app with proper cors to be able to open endpoints
app.get('/actions/rv/style', (req, res, next) => {
  res.set('Content-Type', 'text/css');
  return res.send(fs.readFileSync(path.join(__dirname, './workspace-components/actions/rv/style.css')));
})

app.get('/actions/rv/template', (req, res, next) => {
  res.set('Content-Type', 'text/html');
  return res.send(fs.readFileSync(path.join(__dirname, './workspace-components/actions/rv/template.hbs')));
})

app.get('/actions/rv/component', (req, res, next) => {
  res.set('Content-Type', 'text/javascript');
  return res.send(fs.readFileSync(path.join(__dirname, './workspace-components/actions/rv/component.js')));
})
