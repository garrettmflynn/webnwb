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
import namespace from './core/nwb.namespace.yaml'
import ogen from './core/nwb.ogen.yaml'
import ophys from './core/nwb.ophys.yaml'
import retinotopy from './core/nwb.retinotopy.yaml'
import hdmfBase from './hdmf-common-schema/common/base.yaml'
import hdmfExperimental from './hdmf-common-schema/common/experimental.yaml'
import hdmfNamespace from './hdmf-common-schema/common/namespace.yaml'
import hdmfResources from './hdmf-common-schema/common/resources.yaml'
import hdmfSparse from './hdmf-common-schema/common/sparse.yaml'
import hdmfTable from './hdmf-common-schema/common/table.yaml'

// TODO: Generate NWB-Recognized Object
export const core = {
    base: yaml.parse(base), 
    behavior: yaml.parse(behavior), 
    device: yaml.parse(device), 
    ecephys: yaml.parse(ecephys), 
    epoch: yaml.parse(epoch), 
    file: yaml.parse(file), 
    icephys: yaml.parse(icephys), 
    image: yaml.parse(image), 
    misc: yaml.parse(misc), 
    namespace: yaml.parse(namespace), 
    ogen: yaml.parse(ogen), 
    ophys: yaml.parse(ophys), 
    retinotopy: yaml.parse(retinotopy)
}


export const hdmf = {
    base: yaml.parse(hdmfBase), 
    experimental: yaml.parse(hdmfExperimental), 
    namespace: yaml.parse(hdmfNamespace), 
    resources: yaml.parse(hdmfResources), 
    sparse: yaml.parse(hdmfSparse), 
    table: yaml.parse(hdmfTable)
}