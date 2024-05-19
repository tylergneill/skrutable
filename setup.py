from setuptools import setup, find_packages
import os

def find_version():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    # Construct the path to __init__.py
    init_path = os.path.join(base_dir, 'src', 'skrutable', '__init__.py')
    with open(init_path, 'r', encoding='utf8') as file:
        # Assuming the __version__ line is the first line
        return file.readline().strip().split('=')[1].strip().replace("'", "").replace('"', '')

setup(
    name='skrutable',
    version=find_version(),
    description="skrutable library for working with Sanskrit text",
    long_description=open('README.md').read(),
    long_description_content_type='text/markdown',
    license='CC BY-SA 4.0',
    author="Tyler Neill",
    author_email='tyler.g.neill@gmail.com',
    package_dir={'': 'src'},
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
    extras_require={
        "testing": [
            "pytest",
        ]
    },
)