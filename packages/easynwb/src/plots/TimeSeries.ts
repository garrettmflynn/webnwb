import {LitElement, css, html, } from 'lit';
// import ResizeObserver from 'resize-observer-polyfill';
import { plotlyStyles } from './plotly-styles.js'

export type TimeSeriesProps = {
  max?: number;
  backgroundColor?: string;
  data?: {
    y: any[],
    [x:string]: any
  }[]
  layout?: {[x:string]: any}
  config?: {[x:string]: any}
  colorscale?: 'Hot' | 'Cold' | 'YlGnBu' | 'YlOrRd' | 'RdBu' | 'Portland' | 'Picnic' | 'Jet' | 'Greys' | 'Greens' | 'Electric' | 'Earth' | 'Bluered' | 'Blackbody' | string[][],
  Plotly?: any,
  onClick?: Function
  onLegendClick?: Function
}


const colorscales = ['Hot' , 'Cold' , 'YlGnBu' , 'YlOrRd' , 'RdBu' , 'Portland' , 'Picnic' , 'Jet' , 'Greys' , 'Greens' , 'Electric' , 'Earth' , 'Bluered' , 'Blackbody']

export class TimeSeries extends LitElement {

    static get styles() {
      return [ css`

      :host {
        display: block;
        overflow: hidden;
        height: 100%;
      }
      
      `, 
      
      plotlyStyles ]
    }

    // createRenderRoot() {
    //   return this;
    // }
    
    
    static get properties() {
      return {
        max: {
          type: Number,
          reflect: true
        },
        data: {
          type: Array,
          reflect: true
        },
        layout: {
          type: Object,
          reflect: true,
        },
        config: {
          type: Object,
          reflect: true,
        },
        colorscale: {
          type: Object,
          reflect: true
        },
        backgroundColor: {
          type: String,
          reflect: true,
        },
        onLegendClick: {
          type: Function,
          reflect: true,
        },
        onClick: {
          type: Function,
          reflect: true,
        },
      };
    }

    static colorscales = colorscales
    colorscale: TimeSeriesProps['colorscale'] = 'Electric'
    div: any
    data: TimeSeriesProps['data'] = [];
    plotData: any[] = []
    layout: TimeSeriesProps['layout'] = {}
    windowSize = 300
    binWidth = 256
    Plotly: TimeSeriesProps['Plotly']
    onClick: TimeSeriesProps['onClick']
    onLegendClick: TimeSeriesProps['onLegendClick']
    colorscales = colorscales
    config:TimeSeriesProps['config'] = {}

    constructor(props: TimeSeriesProps={}) {
      super();

      this.data = props.data ?? []
      if (props.layout) this.layout = props.layout
      if (window.Plotly) props.Plotly = window.Plotly

      if (props.colorscale) this.colorscale = props.colorscale
      if (props.onClick) this.onClick = props.onClick
      if (props.onLegendClick) this.onLegendClick = props.onLegendClick
      if (props.config) this.config = props.config

      if (props.Plotly) this.Plotly = props.Plotly
      else console.warn('<visualscript-timeseries->: Plotly instance not provided...')

      // window.addEventListener('resize', this.resize)

      // let observer = new ResizeObserver(() => this.resize());
      // observer.observe(this.div);
  }

  getTraces = () => {
    return this.data.map(o => Object.assign({
      type: "scatter",
      mode: "lines",
      // line: {color: '#000000'}
      // name: 'Voltage',
    }, o))
  }

  getConfig = () => {
    return Object.assign({
      displaylogo: false, 
      // responsive: true
    }, this.config)
  }

  getLayout = () => {
    return Object.assign({
      // title: 'Basic Time Series',
      // responsive: true,
      // autosize: true
    }, this.layout)
  }

  // resize = () => {
  //   this.Plotly.relayout(this.div, {
  //     'xaxis.autorange': true,
  //     'yaxis.autorange': true
  //   })
  // }

    transpose(a) {
      return Object.keys(a[0]).map(function(c) {
          return a.map(function(r) { return r[c]; });
      });
  }


  willUpdate(changedProps:any) {
    
    // if (changedProps.has('data')) {
    //   this.Plotly.newPlot(this.div, this.getTraces(), this.getLayout(), this.getConfig());
    // }

    if (changedProps.has('onClick')) {
      this.div.on('plotly_click', this.onClick);
    }
    if (changedProps.has('onLegendClick')) {
      this.div.on('plotly_legendclick', this.onLegendClick)
    }
  }

  updated() {
    this.div = this.shadowRoot.querySelector('#plotlyDiv')
    this.Plotly.newPlot(this.div, this.getTraces(), this.getLayout(), this.getConfig());

    const resize = () => {
      const rect = this.getBoundingClientRect()
      var update = {
        width: rect.width,
        height: rect.height 
      };
      
      this.Plotly.relayout(this.div, update);
    };

    
    window.addEventListener('resize', resize)
    resize()
  }

  //   updateData = (newData) => {

  //     // For a fixed window size,
  //     // Push the latest data and remove the first element
  //     if (!Array.isArray(newData[0])) newData = [newData]

  //     newData.forEach(d => {
  //       if(this.data.length > this.windowSize) {
  //         this.data.push(d)
  //         this.data.splice(0, 1)
  //       } else {
  //         this.data.push(d);
  //       }
  //     })


  //   this.plotData[0].z[0] = transpose(this.data)
  //     const ticRes = performance.now()
  //     Plotly.restyle(this.div, 'z', this.plotData[0].z);
  //     const tocRes = performance.now()
  //     console.log('Restyle', tocRes - ticRes)

  //     // const ticUp = performance.now()
  //     // Plotly.update(this.div, this.plotData[0])
  //     // const tocUp = performance.now()
  //     // console.log('Update', tocUp - ticUp)

  // //     const ticAn = performance.now()
  // //     Plotly.animate(this.div, {
  // //       data: [{z: this.plotData[0].z, type: 'heatmap'}],
  // //   }, {
  // //       transition: {duration: 0},
  // //       frame: {duration: 0, redraw: true}
  // //   });
  // //   const tocAn = performance.now()
  //   // console.log('Animate', tocAn - ticAn)

  //   }

    render() {
      return html`<div id="plotlyDiv"></div>`
    }
  }
  
  customElements.get('visualscript-timeseries') || customElements.define('visualscript-timeseries',  TimeSeries);