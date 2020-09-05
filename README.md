# Water Mapping App

A [Google Earth Engine](https://code.earthengine.google.com/) App that delineates water bodies around the globe from 1984 until present and provides monthly estimates of surface area of water bodies as well as shapefiles to the user.

##### Table of Contents

- [Introduction](#the-need-for-automation-of-inland-water-body-mapping)
  * [Example](#example)
- [App Options](#app-options)
- [Installation](#installation)
  * [Dependencies](#dependencies)
  * [Quick Install](#quick-install)
    + [Linux](#linux)
    + [Mac](#mac)
    + [Windows](#windows)
  * [Developer Install](#developer-install)
    + [Docker](#docker)
    + [Tomcat War](#tomcat-war)
    + [Cloud VM Template](#cloud-vm-template)
  * [Build from source](#build-from-source)
- [Demo](#demo)
- [Usage](#usage)
  * [Add A Server](#add-a-server)
  * [Create A Process](#create-a-process)
  * [Create A Workflow](#create-a-workflow)
  * [Run Workflow](#run-workflow)
  * [Browse Provenance](#browse-provenance)
  * [Retrieve and Display Results](#retrieve-and-display-results)
  * [I/O workflows](#i-o-workflows)
- [Documentation](#documentation)
- [Dependencies](#dependencies)
- [License](#license)
- [Author](#author)


## The Need for Automation of Inland Water Body Mapping

Inland water bodies play a significant role in hydrological systems, and are essential resources for many human needs such as irrigating croplands and survival of different ecosystems. Both climate change and human interventions are causing large changes in the water bodies on a global scale and such changes will affect agriculture, industry, ecology, and population. The need to map surface water bodies becomes more revealing in water resources management of basins in remote locations with no gauging instruments. Recent advances in satellite‐based optical remote sensors have provided a routine approach for monitoring land surface water bodies in real-time. 

### Example

A demonstration is shown in the figure below, where the image to the left is the Pyramid Lake (located in Nevada, United States) true color composite of three red, green and blue bands from Landsat 8 and the image to the right is the extracted water body that is comprised of water (cyan areas) and non-water (black areas) features.

![Example](assests/Images/Untitled-1.gif)

## App Options

The App is desigend in way that users can have the following options:

1. Users can select feom range of Spectral Water Indices including
-ANDWI
-MNDWI
-NDWI
-AWEIsh
-AWEInsh
-WI
2. Select their study area using a polygon drawing feature 
3. Chose from the two options of 
-Hard thersholding (e.g., zero defining the threshold seperating water and non-water)
-Dynamic thersholding (e.g., Otsu method for finding optimum threshold seperating water and non-water)
4. Select an exporting method
-Google Drive
-Google Assets
5. Select an ID associated with the date of intrest to export a shapefile of water body



For more details see [GitHub Flavored Markdown](https://guides.github.com/features/mastering-markdown/).

### Jekyll Themes

Your Pages site will use the layout and styles from the Jekyll theme you have selected in your [repository settings](https://github.com/arashmodrad/Water_Mapping_App/settings). The name of this theme is saved in the Jekyll `_config.yml` configuration file.

### Support or Contact

Having trouble with Pages? Check out our [documentation](https://docs.github.com/categories/github-pages-basics/) or [contact support](https://github.com/contact) and we’ll help you sort it out.
