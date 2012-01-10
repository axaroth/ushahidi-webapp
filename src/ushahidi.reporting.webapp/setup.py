from setuptools import setup, find_packages
import os

version = '0.1'

setup(name='ushahidi.reporting.webapp',
      version=version,
      description="",
      long_description=open("README.txt").read() + "\n" +
                       open(os.path.join("docs", "HISTORY.txt")).read(),
      classifiers=[],
      keywords='',
      author='',
      author_email='',
      url='',
      license='GPL',
      packages=find_packages(exclude=['ez_setup']),
      namespace_packages=['ushahidi', 'ushahidi.reporting'],
      include_package_data=True,
      zip_safe=False,
      install_requires=[
          'setuptools',
      ],
      entry_points={
          'paste.app_factory': [
              'manifest=ushahidi.reporting.webapp:manifest.app_factory',
              'api=ushahidi.reporting.webapp:api.app_factory',
           ],
          },
      )
