import yaml from 'yaml'

import base from './core/nwb.base.yaml'
import behavior from './core/nwb.behavior.yaml'
import device from './core/nwb.device.yaml'
import ecephys from './core/nwb.ecephys.yaml'
import epoch from './core/nwb.epoch.yaml'
import file from './core/nwb.file.yaml'
import icephys from './core/nwb.icephys.yaml'
import image from './core/nwb.image.yaml'
import misc from './core/nwb.misc.yaml'
import namespace from './core/namespace.yaml'
import ogen from './core/nwb.ogen.yaml'
import ophys from './core/nwb.ophys.yaml'
import retinotopy from './core/nwb.retinotopy.yaml'
import hdmfBase from './hdmf-common-schema/common/base.yaml'
import hdmfExperimental from './hdmf-common-schema/common/experimental.yaml'
import hdmfNamespace from './hdmf-common-schema/common/namespace.yaml'
import hdmfResources from './hdmf-common-schema/common/resources.yaml'
import hdmfSparse from './hdmf-common-schema/common/sparse.yaml'
import hdmfTable from './hdmf-common-schema/common/table.yaml'

const parse = (input: string) => JSON.stringify(yaml.parse(input))

export const namespaces = {
    nwb: typeof namespace === 'string' ? yaml.parse(namespace) : namespace,
    hdmf: typeof hdmfNamespace === 'string' ? yaml.parse(hdmfNamespace) : hdmfNamespace
}

export const core = {
    ['nwb.base']: parse(base), 
    ['nwb.behavior']: parse(behavior), 
    ['nwb.device']: parse(device), 
    ['nwb.ecephys']: parse(ecephys), 
    ['nwb.epoch']: parse(epoch), 
    ['nwb.file']: parse(file), 
    ['nwb.icephys']: parse(icephys), 
    ['nwb.image']: parse(image), 
    ['nwb.misc']: parse(misc), 
    ['nwb.ogen']: parse(ogen), 
    ['nwb.ophys']: parse(ophys), 
    ['nwb.retinotopy']: parse(retinotopy)
}


export const hdmf = {
    base: parse(hdmfBase), 
    experimental: parse(hdmfExperimental), 
    resources: parse(hdmfResources), 
    sparse: parse(hdmfSparse), 
    table: parse(hdmfTable)
}