import React from 'react';
import whyDidYouRender from '@welldone-software/why-did-you-render';

whyDidYouRender(React, {
    trackAllPureComponents: true,
    trackExtraProperties: true,
    logOnDifferentValues: true,
    collapseGroups: true,
});