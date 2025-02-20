import React from 'react'
import PropTypes from 'prop-types'

import Box from '@mui/material/Box'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'

import version from '../version.js'

const Footer = (props) => {
    return (
        <Box sx={props.sx}>
            { /* Made in Germany :D */}
            <Box sx={{ mx: 'auto', mt: 0 }}>
                <Typography
                align='center'
                display='block'>
                Made with ❤️ by <Link href='https://spacehuhn.com' target='_blank' underline='hover' color='inherit'>Spacehuhn</Link>
                </Typography>
            </Box>

            { /* Version */}
            <Typography
                variant='caption'
                align='center'
                display='block'
                sx={{ color: '#ddd' }}>
                <Link href='https://github.com/spacehuhntech/espwebtool' target='_blank' underline='hover' color='inherit'>{version.name}</Link>
            </Typography>
        </Box>
    )
}

Footer.propTypes = {
    sx: PropTypes.object,
}

export default Footer      