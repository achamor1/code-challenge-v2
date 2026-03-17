import React, { useEffect, useState } from "react"

import { MapContainer, TileLayer, GeoJSON } from "react-leaflet"

import "leaflet/dist/leaflet.css"

import RAW_COMMUNITY_AREAS from "../../../data/raw/community-areas.geojson"

function YearSelect({ setFilterVal }) {
  // Filter by the permit issue year for each restaurant
  const startYear = 2026
  const years = [...Array(11).keys()].map((increment) => {
    return startYear - increment
  })
  const options = years.map((year) => {
    return (
      <option value={year} key={year}>
        {year}
      </option>
    )
  })

  return (
    <>
      <label htmlFor="yearSelect" className="fs-3">
        Filter by year:{" "}
      </label>
      <select
        id="yearSelect"
        className="form-select form-select-lg mb-3"
        onChange={(e) => setFilterVal(e.target.value)}
      >
        {options}
      </select>
    </>
  )
}

export default function RestaurantPermitMap() {
  const communityAreaColors = ["#eff3ff", "#bdd7e7", "#6baed6", "#2171b5"]

  const [currentYearData, setCurrentYearData] = useState([])
  const [year, setYear] = useState(2026)

  const yearlyDataEndpoint = `/map-data/?year=${year}`

  useEffect(() => {
    fetch(yearlyDataEndpoint)
      .then((res) => {
        if(!res.ok) 
          throw new Error(`Server error: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setCurrentYearData(data)
      })
      .catch(error => {
        console.error('Error fetching data:', error)
      })
  }, [yearlyDataEndpoint])

  /**
   * Add up number of permits per community area, returning citywide total for a given year
   */
  const totalSum = currentYearData.reduce((accumulator, currentValue) => {
    return accumulator + Object.values(currentValue)[0].num_permits;
  }, 0)

  /**
   * Iterate through number of permits per community area, returning the maximum value found
   */
  const maxNumPermits = currentYearData.reduce((accumulator, currentValue) => {
    return accumulator > Object.values(currentValue)[0].num_permits ? accumulator : Object.values(currentValue)[0].num_permits;
  }, 0)

  /**
   * Helper funcion for getColor. Computes percentage of permits 
   * per ward out of the max number of permits for a given year.
   */
  function getPercentageOfPermits(communityPermits) {
    if (maxNumPermits === 0){return 0}
    return Math.round((communityPermits / maxNumPermits) * 100)
  }

  /**
  * Splits percentages into 4 'buckets' corresponding
  * to each array entry in communityAreaColors
  * Bucket 1: |  0% - 24% | #eff3ff
  * Bucket 2: | 25% - 49% | #bdd7e7
  * Bucket 3: | 50% - 74% | #6baed6
  * Bucket 4: | 75% - 100% | #2171b5
  */
  function getColor(percentageOfPermits) {
    if (percentageOfPermits < 25) {
      return communityAreaColors[0]
    } else if (percentageOfPermits <50) {
      return communityAreaColors[1]
    } else if (percentageOfPermits < 75) {
      return communityAreaColors[2]
    } else {
      return communityAreaColors[3]
    }
  }

  function setAreaInteraction(feature, layer) {

    // Get community area object that corresponds to current geojson feature
    const currentCommunityObj = currentYearData.find(communityArea => Object.keys(communityArea)[0] === feature.properties.community)
    const communityPermits = Object.values(currentCommunityObj)[0].num_permits

    const percentageOfPermits = getPercentageOfPermits(communityPermits)

    layer.setStyle({color: 'black', weight: 1.5, fillColor: getColor(percentageOfPermits), fillOpacity: 1})
    layer.on("click", () => {
      layer.bindPopup(
        `<b>${feature.properties.community}</b></br>
        <span>Year: ${year}<span></br>
        <span>Permits issued: ${communityPermits}</span>`)
      layer.openPopup()
    })
  }

  return (
    <main>
      <section aria-label="Filter controls">
        <YearSelect filterVal={year} setFilterVal={setYear} />
      </section>

      <section aria-label="Summary statistics">
        <p className="fs-4">
          Restaurant permits issued this year: {totalSum}
        </p>
        <p className="fs-4">
          Maximum number of restaurant permits in a single area:
          {maxNumPermits}
        </p>
      </section>

      <section aria-label="Map legend">
        <strong>Permits (% of max)</strong>
        <ul style={{listStyle: "none", padding: 0}}>
          <li>
            <span style={{background: communityAreaColors[0],     
            padding: "0 8px"}}>&nbsp;</span> 0–24%
          </li>
          <li>
            <span style={{background: communityAreaColors[1],     
            padding: "0 8px"}}>&nbsp;</span> 25–49%
          </li>
          <li>
            <span style={{background: communityAreaColors[2],     
            padding: "0 8px"}}>&nbsp;</span> 50–74%
          </li>
          <li>
            <span style={{background: communityAreaColors[3],     
            padding: "0 8px"}}>&nbsp;</span> 75–100%
          </li>
        </ul>
      </section>

      <section aria-label="Map of Chicago restaurant permits by community area">
        <p aria-live="polite">
          {currentYearData.length === 0 ?     
          "Loading map data..." : ""}
        </p>
        <MapContainer
          id="restaurant-map"
          center={[41.88, -87.62]}
          zoom={10}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"
          />
          {currentYearData.length > 0 ? (
            <GeoJSON
              data={RAW_COMMUNITY_AREAS}
              onEachFeature={setAreaInteraction}
              key={maxNumPermits}
            />
          ) : null}
        </MapContainer>
      </section>
    </main>
  )
}
