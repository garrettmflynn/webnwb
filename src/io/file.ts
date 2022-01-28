export const test = () => {}
// export class NWBFileMap {

//     constructor(spec){
//         this.spec = spec
//         const acq_spec = this.spec.get_group('acquisition')
//         this.unmap(acq_spec)
//         this.map_spec('acquisition', acq_spec.get_neurodata_type('NWBDataInterface'))
//         this.map_spec('acquisition', acq_spec.get_neurodata_type('DynamicTable'))
//         // TODO: note that double mapping "acquisition" means __carg2spec and __attr2spec (both unused)
//         // map "acquisition" to the last spec, in this case, DynamicTable

//         const ana_spec = this.spec.get_group('analysis')
//         this.unmap(ana_spec)
//         this.map_spec('analysis', ana_spec.get_neurodata_type('NWBContainer'))
//         this.map_spec('analysis', ana_spec.get_neurodata_type('DynamicTable'))

//         // map constructor arg and property 'stimulus' -> stimulus__presentation
//         const stimulus_spec = this.spec.get_group('stimulus')
//         this.unmap(stimulus_spec)
//         this.unmap(stimulus_spec.get_group('presentation'))
//         this.unmap(stimulus_spec.get_group('templates'))
//         this.map_spec('stimulus', stimulus_spec.get_group('presentation').get_neurodata_type('TimeSeries'))
//         this.map_spec('stimulus_template', stimulus_spec.get_group('templates').get_neurodata_type('TimeSeries'))

//         const intervals_spec = this.spec.get_group('intervals')
//         this.unmap(intervals_spec)
//         this.map_spec('intervals', intervals_spec.get_neurodata_type('TimeIntervals'))

//         const epochs_spec = intervals_spec.get_group('epochs')
//         this.map_spec('epochs', epochs_spec)

//         const trials_spec = intervals_spec.get_group('trials')
//         this.map_spec('trials', trials_spec)

//         const invalid_times_spec = intervals_spec.get_group('invalid_times')
//         this.map_spec('invalid_times', invalid_times_spec)

//         const general_spec = this.spec.get_group('general')
//         this.unmap(general_spec)

//         // map icephys metadata structures and tables
//         const icephys_spec = general_spec.get_group('intracellular_ephys')
//         this.unmap(icephys_spec)
//         this.map_spec('icephys_electrodes', icephys_spec.get_neurodata_type('IntracellularElectrode'))
//         this.map_spec('sweep_table', icephys_spec.get_neurodata_type('SweepTable'))
//         this.map_spec('intracellular_recordings', icephys_spec.get_neurodata_type('IntracellularRecordingsTable'))
//         this.map_spec('icephys_simultaneous_recordings', icephys_spec.get_neurodata_type('SimultaneousRecordingsTable'))
//         this.map_spec('icephys_sequential_recordings', icephys_spec.get_neurodata_type('SequentialRecordingsTable'))
//         this.map_spec('icephys_repetitions', icephys_spec.get_neurodata_type('RepetitionsTable'))
//         this.map_spec('icephys_experimental_conditions', icephys_spec.get_neurodata_type('ExperimentalConditionsTable'))

//         // 'filtering' has been deprecated. add this mapping in the meantime
//         const icephys_filtering_spec = icephys_spec.get_dataset('filtering')
//         this.unmap(icephys_filtering_spec)
//         this.map_spec('icephys_filtering', icephys_filtering_spec)

//         const ecephys_spec = general_spec.get_group('extracellular_ephys')
//         this.unmap(ecephys_spec)
//         this.map_spec('electrodes', ecephys_spec.get_group('electrodes'))
//         this.map_spec('electrode_groups', ecephys_spec.get_neurodata_type('ElectrodeGroup'))

//         const ogen_spec = general_spec.get_group('optogenetics')
//         this.unmap(ogen_spec)
//         this.map_spec('ogen_sites', ogen_spec.get_neurodata_type('OptogeneticStimulusSite'))

//         const ophys_spec = general_spec.get_group('optophysiology')
//         this.unmap(ophys_spec)
//         this.map_spec('imaging_planes', ophys_spec.get_neurodata_type('ImagingPlane'))

//         const general_datasets = ['data_collection',
//                             'experiment_description',
//                             'experimenter',
//                             'institution',
//                             'keywords',
//                             'lab',
//                             'notes',
//                             'pharmacology',
//                             'protocol',
//                             'related_publications',
//                             'session_id',
//                             'slices',
//                             'source_script',
//                             'stimulus',
//                             'surgery',
//                             'virus'
                        
//                         ]
//         for (let dataset_name in general_datasets) this.map_spec(dataset_name, general_spec.get_dataset(dataset_name))

//         // Note: constructor arg and property 'stimulus' is already mapped above, so use a different name here
//         this.map_spec('stimulus_notes', general_spec.get_dataset('stimulus'))
//         this.map_spec('source_script_file_name', general_spec.get_dataset('source_script').get_attribute('file_name'))

//         this.map_spec('subject', general_spec.get_group('subject'))

//         const device_spec = general_spec.get_group('devices')
//         this.unmap(device_spec)
//         this.map_spec('devices', device_spec.get_neurodata_type('Device'))

//         this.map_spec('lab_meta_data', general_spec.get_neurodata_type('LabMetaData'))

//         const proc_spec = this.spec.get_group('processing')
//         this.unmap(proc_spec)
//         this.map_spec('processing', proc_spec.get_neurodata_type('ProcessingModule'))

//         const scratch_spec = this.spec.get_group('scratch')
//         this.unmap(scratch_spec)
//         this.map_spec('scratch_datas', scratch_spec.get_neurodata_type('ScratchData'))
//         this.map_spec('scratch_containers', scratch_spec.get_neurodata_type('NWBContainer'))
//         this.map_spec('scratch_containers', scratch_spec.get_neurodata_type('DynamicTable'))

//     }

// scratchDatas(container){
//     const scratch = container.scratch
//     const ret = []
//     for (let s in scratch.values()) if (s instanceof ScratchData) ret.push(s)
//     return ret
// }

// scratchContainers(container) {
//     const scratch = container.scratch
//     const ret = []
//     for (let s in scratch.values()) if (!(s instanceof ScratchData)) ret.push(s)
//     return ret
// }

// scratch(builder, manager){
//     const scratch = builder.get('scratch')
//     const ret = []
//     if (scratch){
//         for (let g in scratch.groups.values()) ret.push(manager.construct(g))
//         for (let d in scratch.datasets.values()) ret.push(manager.construct(d))
//     }
//     return (ret.length > 0) ? ret : null
// }

// dateconversion(builder){
//     const datestr = builder.get('session_start_time').data
//     const date = dateutil_parse(datestr)
//     return date
// }

// dateconversion_trt(builder){
//     const datestr = builder.get('timestamps_reference_time').data
//     const date = dateutil_parse(datestr)
//     return date
// }

// dateconversion_list(builder){
//     const datestr = builder.get('file_create_date').data
//     const dates = list(map(dateutil_parse, datestr))
//     return dates
// }

// name(builder){
//     return builder.name
// }

// experimenterCargs(builder){
//     return builder['general'].get('experimenter') ?? null
// }

// experimenterObjAttr(container){
//     return (typeof container.experimenter === 'string') ?? container.experimenter : null
// }

// publicationsCargs(builder){
//     return builder['general'].get('related_publications') ?? null
// }

// publicationObjAttr(container){
//     return (typeof container.related_publications === 'string') ?? container.related_publications : null
// }
// }