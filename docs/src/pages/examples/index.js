import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ExampleSelector from './selector';

const SERVER_URI = (window.location.href.includes('localhost')) ? 'http://localhost:443' : 'http://localhost:443' // Replace with production server URI

export default function Examples() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} | Examples`}
      description={`Examples for ${siteConfig.title}.`}>
      <ExampleSelector 
        server={SERVER_URI}
      />
    </Layout>
  );
}
