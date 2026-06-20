export default {
  'perfectionist/sort-enums': [
    'error',
    {
      order: 'asc',
      sortByValue: 'always',
      type: 'natural',
    },
  ],
  'perfectionist/sort-exports': [
    'error',
    {
      order: 'asc',
      type: 'natural',
    },
  ],
  'perfectionist/sort-imports': [
    'error',
    {
      order: 'asc',
      type: 'natural',
      customGroups: [
        {
          elementNamePattern: ['^react$', '^react-.+'],
          groupName: 'react',
        },
        {
          elementNamePattern: ['^expo$', '^expo-.+'],
          groupName: 'expo',
        },
      ],
      groups: [
        'side-effect',
        'react',
        'external',
        'internal',
        'parent',
        'sibling',
        'style',
      ],
    },
  ],
  'perfectionist/sort-jsx-props': [
    'error',
    {
      order: 'asc',
      type: 'natural',
      customGroups: [
        {
          elementNamePattern: ['^key$'],
          groupName: 'key',
        },
        {
          elementNamePattern: ['^id$', '^testID$'],
          groupName: 'main-identifier',
        },
        {
          elementNamePattern: ['.*Id$', '.*ID$'],
          groupName: 'secondary-identifier',
        },
        {
          elementNamePattern: ['^on[A-Z][a-zA-Z]*$'],
          groupName: 'method',
        },
        {
          elementNamePattern: ['^style$'],
          groupName: 'style',
        },
      ],
      groups: [
        'key',
        'main-identifier',
        'secondary-identifier',
        'unknown',
        'method',
        'multiline-prop',
        'shorthand-prop',
        'style',
      ],
    },
  ],
  'perfectionist/sort-object-types': [
    'error',
    {
      order: 'asc',
      type: 'natural',
      customGroups: [
        {
          elementNamePattern: ['^id$', '^testID$'],
          groupName: 'main-identifier',
        },
        {
          elementNamePattern: ['.*Id$', '.*ID$'],
          groupName: 'secondary-identifier',
        },
      ],
      groups: [
        'main-identifier',
        'secondary-identifier',
        'required-property',
        'optional-property',
        'method',
        'multiline-member',
      ],
    },
  ],
  'perfectionist/sort-objects': [
    'error',
    {
      order: 'asc',
      type: 'natural',
      customGroups: [
        {
          elementNamePattern: ['^id$', '^testID$'],
          groupName: 'main-identifier',
        },
        {
          elementNamePattern: ['.*Id$', '.*ID$'],
          groupName: 'secondary-identifier',
        },
      ],
      groups: [
        'main-identifier',
        'secondary-identifier',
        'unknown',
        'method',
        'multiline-member',
      ],
    },
  ],
  'perfectionist/sort-switch-case': [
    'error',
    {
      type: 'unsorted',
    },
  ],
  'perfectionist/sort-union-types': [
    'error',
    {
      type: 'unsorted',
    },
  ],
}
