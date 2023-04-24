# Creating an NWB File from Scratch
This example will guide you through the acquisition of behavioral and functional near-infrared spectroscopy (fNIRS) data that we will write to a new NWB file as users navigate a webpage.

::: info Future Development
Tutorial #3 currently only illustrates how to track behavioral data for visitors to a web page. 

In the near future, we will add the following explanations:
1.  How to acquire fNIRS device data using [`device-decoder`](https://github.com/brainsatplay/device-decoder) + the [ndx-nirs extension](https://github.com/agencyenterprise/ndx-nirs)
2.  How to define a [new EMG extension](https://pynwb.readthedocs.io/en/stable/tutorials/general/extensions.html#sphx-glr-tutorials-general-extensions-py) for NWB files + acquire data using [`device-decoder`](https://github.com/brainsatplay/device-decoder)
:::

### Creating a NWB File from Scratch

Create a NWBFile object with the required fields (session_description, identifier, session_start_time) and additional metadata.

```js
import nwb from 'webnwb' 
const file = new nwb.NWBFile({     
    session_description: 'EEG data and behavioral data recorded while navigating a webpage.',     
    identifier: 'WebNWB_Documentation_Session_' + Math.random().toString(36).substring(7),     
    session_start_time: Date.now(),     
    experimenter: 'Garrett Flynn',     
    institution: 'Brains@Play' 
})
```

We will also add a Subject to this experiment.

```js
const subject = new nwb.Subject({     
    subject_id: Math.random().toString(36).substring(7),     
    description: "someone using the website",     
    species: "Homo sapien",     
    sex: "U", 
})  

file.general.subject = subject   
```

:::details Alternative Schema-Compliant Strategies to Set the Subject
The following are equivalent methods for setting the subject on the NWBFile object:
```js
file.general.subject = new nwb.Subject(subject) 
file.createSubject(subject) 
file.addSubject(new nwb.Subject(subject)) 
file.addSubject(subject)
```
:::
                
        
### Acquiring Behavioral Data

`SpatialSeries` is a subclass of `TimeSeries` that represents data in space, such as the position of the user's cursor over time.

In SpatialSeries data, the first dimension is always time (in seconds), the second dimension represents the x, y position. SpatialSeries data should be stored as one continuous stream as it is acquired, not by trials as is often reshaped for analysis.

We will use the `webtrack` library to track the user's cursor position in addition to other user and page-driven events.

```js
import * as webtrack from 'webtrack' 
const tracker = webtrack.Tracker()  
const spatialSeries = new nwb.SpatialSeries({     
    name: 'cursor',     
    description: 'The position (x, y) of the cursor over time.',     
    data: [[],[]],     
    reference_frame: '(0,0) is the top-left corner of the visible portion of the page.' 
})  

const startTime = Date.now() 
tracker.start((info) => {     
    if (info.type === 'pointermove'){         
        const { x, y, timestamp } = info         
        spatialSeries.data[0].push(x)         
        spatialSeries.data[1].push(y)         
        const secondsSincePageLoad = timestamp / 1000         
        spatialSeries.timestamps.push(secondsSincePageLoad)     
    } 
})
```

### Storing Behavioral Data to the NWB File
To help data analysis and visualization tools know that this SpatialSeries object represents the position of the user, store the SpatialSeries object inside a Position object, which can hold one or more SpatialSeries objects.

```js
const position = new nwb.Position() position.addSpatialSeries(spatialSeries)
```            
                

Create a processing module called "behavior" for storing behavioral data in the NWBFile, then add the Position object to the processing module.

```js
const behavior = new nwb.ProcessingModule({ 
    description: 'Behavioral data recorded while navigating a webpage.' 
}) 

behavior.add(position) 
file.addProcessingModule(behavior)
```
                    
                

### Adding Behavioral Events

Unlike user behaviors, page events should be stored as BehavioralEvents, which is used to store the timing and amount of rewards (e.g. showing an emoji) related to a behavior (e.g. clicking the mouse).

Click to activate behavioral rewards and related tracking. Now you can click the mouse and see an emoji!

```js
// Create a TimeSeries object to track behavior events 
const data = [] 
data.unit = 'ms' 
const timeseries = new nwb.TimeSeries({     
    description: 'The length of time the emoji was shown on the page.',    
    data: [],     
    timestamps: [] 
})  

// Create the emoji to display on the UI 
const emoji = document.createElement('span') 
emoji.innerText = '😊' 
emoji.style.transform = 'translate(-50%, -50%)' 
emoji.style.position = 'fixed' 
emoji.style.display = 'none' 
emoji.style.fontSize = '100px' 
emoji.style.zIndex = '1000' 
emoji.style.userSelect = 'none' 
document.body.appendChild(emoji)  

// Track mouse clicks and show the emoji for a random amount of time (up to 1s) 
let active = false tracker.set('click', (info) => {      
    if (!active) {         
        emoji.style.display = 'block'         
        emoji.style.left = info.x + 'px'         
        emoji.style.top = info.y + 'px'         
        active = true          
        const msToShow = Math.random() * 1000         
        setTimeout(() => {             
            emoji.style.display = 'none'             
            active = false           
        }, msToShow)          
        emoji.style.display = 'none'         
        timeseries.data.push(msToShow)         
        timeseries.timestamps.push(info.timestamp / 1000)     
    } 
})   

// Add these behavioral events to the NWB file 
const behavioralEvents = new nwb.BehavioralEvents() 
behavioralEvents.addTimeSeries('emojiReactions', timeseries) 
behavior.add(behavioralEvents)
```                    

### Download the Acquired Data
Just like in the [write](./write) tutorial, you'll use the `save` command to save this data. However, you'll need to provide your own filename this time.

```js
const filename = 'myFile.nwb' 
const io = new nwb.NWBHDF5IO() 
io.save(file, filename) 
io.download(filename)
```