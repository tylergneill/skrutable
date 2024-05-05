from setuptools import setup, find_packages


setup(
    name='skrutable',
    version='1.2.1',
    description="skrutable library for working with Sanskrit text",
    license='CC BY-SA 4.0',
    author="Tyler Neill",
    author_email='tyler.g.neill@gmail.com',
    package_dir={'':'src'},
    packages=[
    	"skrutable",
    	],
    py_modules=[
    	"skrutable.transliteration",
    	"skrutable.scansion",
    	"skrutable.meter_identification",
    	"skrutable.splitter.wrapper",
    ],
    package_data={'': [
		'config.json',
		'manual.md'
	]},
    url='https://github.com/tylergneill/skrutable',
    keywords='Sanskrit text transliteration scansion meter identification sandhi compound splitting',
    install_requires=[
          'numpy',
          'requests',
      ],

)