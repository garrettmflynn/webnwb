import buffer from 'buffer'
(globalThis).Blob = buffer.Blob // Ensure blob is resolved (tinybuild mistake)