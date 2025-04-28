module.exports = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    'postcss-preset-env': {
      features: {
        'nesting-rules': false,
      },
      browsers: ['> 1%', 'last 2 versions', 'Firefox ESR', 'not dead'],
      stage: 3,
      autoprefixer: false
    }
  }
} 