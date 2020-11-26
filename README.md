# Water Mapping App

A [Google Earth Engine](https://code.earthengine.google.com/) App that delineates water bodies around the globe from 1984 until present and provides 16 day estimates of surface area of water bodies as well as shapefiles to the user.

##### Table of Contents

- [Introduction](#the-need-for-automation-of-inland-water-body-mapping)
  * [Example](#example)
- [App Options](#app-options)
- [How To?](#how-to)
  * [Tutorial](#tutorial)
  * [GEE Code Edithor](#gee-code-edithor)
  * [Cloning](#Cloning)
- [Documentation](#documentation)
  * [Cloud Filtering](#cloud-filtering)
  * [Augmented Normalized Difference Water Index](#augmented-normalized-difference-water-index)
  * [References](#references)
- [Acknowledgments](#acknowledgments)
- [Authors](#authors)
- [License](#license)

## The Need for Automation of Inland Water Body Mapping

Inland water bodies play a significant role in hydrological systems, and are essential resources for many human needs such as irrigating croplands and survival of different ecosystems. Both climate change and human interventions are causing large changes in the water bodies on a global scale and such changes will affect agriculture, industry, ecology, and population. The need to map surface water bodies becomes more revealing in water resources management of basins in remote locations with no gauging instruments. Recent advances in satellite‐based optical remote sensors have provided a routine approach for monitoring land surface water bodies in real-time. 

### Example

A demonstration is shown in the figure below, where the image to the left is the Pyramid Lake (located in Nevada, United States) true color composite of three red, green and blue bands from Landsat 8 and the image to the right is the extracted water body that is comprised of water (cyan areas) and non-water (black areas) features.

![Example](assests/Images/Untitled-1.gif)

Also a time laps of Hamun lake is shown below that covers a period of 1984-2020.
![Example](assests/Images/Hamun.gif)

## App Options

The App is desigend in way that users can have the following options:

1. #### Users can select from range of Spectral Water Indices including

- ANDWI

- MNDWI

- NDWI

- AWEIsh

- AWEInsh

- WI

2. #### Select a study area using a polygon drawing feature

3. #### Chose from the two options of

- Hard thersholding (e.g., zero defining the threshold seperating water and non-water)

- Dynamic thersholding (e.g., Otsu method for finding optimum threshold seperating water and non-water)

4. #### Select an exporting method

- Google Drive

- Google Assets

5. #### Select an ID associated with the date of intrest to export a shapefile of water body

## How To?


### Tutorial

YouTube tutorial video:

Here is a YouTube link to the vidoe [YouTube](https://youtu.be/7RovfG7IeM8).

![Example2](assests/Images/sshot-1.gif)

### GEE Code Edithor

To access the project first a GEE acount must be created [SignUp GEE](https://earthengine.google.com/signup/), then one can use th Google Earth Engine Link below to Share the Project: 

Here is a GEE link to the project [Water Mapping App](https://code.earthengine.google.com/?accept_repo=users/Water_Delineation/water).

![Example3](assests/Images/APP.gif)

### Cloning

```shell
git clone https://earthengine.googlesource.com/users/Water_Delineation/water
```
## Documentation

### Cloud Filtering 

To deal with cloudy scenes a novel framework was developed that filters only those images that cloud is on top of the water body. The CFMASK algorithm in Landsat imagery can result in inappropriate removal of clouds in some scenes due to relatively high commission errors produced by this algorithm. My proposed method uses historical changes of difference of two water indices (in which one classifies clouds as water and the other does not) to filter out cloudy scenes. This method increases the number of useful imageries compared to cloud percentage-based filtering algorithms and thus provides more observations over time.

### Augmented Normalized Difference Water Index  

A novel spectral index namely Augmented Normalized Difference Water Index (ANDWI) is proposed by analyzing reflectance characteristics of water and non-water surface features in Landsat 4, 5, 7, and 8 surface reflectance imagery. ANDWI is defined as the normalized difference of visible and near inferred bands. Results showed that ANDWI is more robust compared to the other spectral water indices but when it is used with zero thresholding it can generate commission errors due to presence of shadows, asphalts, and dark and bright rooftops. However, Otsu thresholding appropriately adjusts the threshold automatically and removes these commission errors thus further increases the overall accuracy of ANDWI.

### References  

...

# Acknowledgments

![Example4](assests/Images/CUAHSI-Logo-with-URL---Transparent_(RESIZED).gif)

This material is based on grant provided by CUAHSI with support from the National Science Foundation (NSF) Cooperative Agreement No. EAR-1849458.

# Authors

[developer list](authors.md)

# License

MIT
