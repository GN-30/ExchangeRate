import React from "react";
import {
  MapPin,
  Clock,
  Wallet,
  Navigation,
  Cloud,
  CloudRain,
  Sun,
  CloudSun,
  Wind,
  Droplets,
  Thermometer,
  Umbrella,
  Gauge,
} from "lucide-react";


// ============================================================
// WEATHER CARD
// ============================================================

const WeatherCard = ({ weather }) => {
  if (!weather) {
    return null;
  }

  const condition =
    weather.condition ||
    weather.description ||
    "Weather information unavailable";

  const description =
    weather.description ||
    weather.condition ||
    "No weather description available";

  const temp =
    weather.tempCelsius !== undefined &&
    weather.tempCelsius !== null
      ? `${Math.round(weather.tempCelsius)}°C`
      : "--";

  const minTemp =
    weather.minTempCelsius !== undefined &&
    weather.minTempCelsius !== null
      ? `${Math.round(weather.minTempCelsius)}°C`
      : "--";

  const maxTemp =
    weather.maxTempCelsius !== undefined &&
    weather.maxTempCelsius !== null
      ? `${Math.round(weather.maxTempCelsius)}°C`
      : "--";

  const feelsLike =
    weather.feelsLikeCelsius !== undefined &&
    weather.feelsLikeCelsius !== null
      ? `${Math.round(weather.feelsLikeCelsius)}°C`
      : "--";

  const rainProbability =
    weather.rainProbability !== undefined &&
    weather.rainProbability !== null
      ? `${Math.round(weather.rainProbability)}%`
      : "--";

  const humidity =
    weather.humidity !== undefined &&
    weather.humidity !== null
      ? `${Math.round(weather.humidity)}%`
      : "--";

  const windSpeed =
    weather.windSpeedKmh !== undefined &&
    weather.windSpeedKmh !== null
      ? `${Math.round(weather.windSpeedKmh)} km/h`
      : "--";

  const rainfall =
    weather.rainfallMm !== undefined &&
    weather.rainfallMm !== null
      ? `${Number(weather.rainfallMm).toFixed(1)} mm`
      : "--";

  const outdoorScore =
    weather.outdoorScore !== undefined &&
    weather.outdoorScore !== null
      ? Math.round(weather.outdoorScore)
      : null;

  const suitability =
    weather.suitability || "Not available";

  const advice =
    weather.weatherAdvice ||
    "Check local weather conditions before heading out.";

  const isRealForecast =
    weather.isRealForecast === true;

  const getWeatherIcon = () => {
    const text = condition.toLowerCase();

    if (
      text.includes("rain") ||
      text.includes("drizzle") ||
      text.includes("shower")
    ) {
      return <CloudRain size={28} />;
    }

    if (
      text.includes("cloud") ||
      text.includes("overcast")
    ) {
      return <Cloud size={28} />;
    }

    if (
      text.includes("partly") ||
      text.includes("few clouds")
    ) {
      return <CloudSun size={28} />;
    }

    return <Sun size={28} />;
  };

  return (
    <div
      style={{
        marginTop: "18px",
        padding: "20px",
        borderRadius: "16px",
        background: "linear-gradient(135deg, #f8fbff, #eef6ff)",
        border: "1px solid #dcecff",
        boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "15px",
          marginBottom: "18px",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {getWeatherIcon()}

            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: "18px",
                  fontWeight: "700",
                }}
              >
                {condition}
              </h3>

              <p
                style={{
                  margin: "4px 0 0",
                  color: "#64748b",
                  fontSize: "13px",
                  textTransform: "capitalize",
                }}
              >
                {description}
              </p>
            </div>
          </div>
        </div>

        <div
          style={{
            textAlign: "right",
          }}
        >
          <div
            style={{
              fontSize: "30px",
              fontWeight: "800",
            }}
          >
            {temp}
          </div>

          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
            }}
          >
            {isRealForecast
              ? "Live forecast"
              : "Estimated forecast"}
          </div>
        </div>
      </div>

      {/* TEMPERATURE */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        <WeatherStat
          icon={<Thermometer size={17} />}
          label="Min"
          value={minTemp}
        />

        <WeatherStat
          icon={<Thermometer size={17} />}
          label="Max"
          value={maxTemp}
        />

        <WeatherStat
          icon={<Thermometer size={17} />}
          label="Feels Like"
          value={feelsLike}
        />
      </div>

      {/* WEATHER DETAILS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(130px, 1fr))",
          gap: "10px",
        }}
      >
        <WeatherStat
          icon={<Umbrella size={17} />}
          label="Rain Chance"
          value={rainProbability}
        />

        <WeatherStat
          icon={<Droplets size={17} />}
          label="Humidity"
          value={humidity}
        />

        <WeatherStat
          icon={<Wind size={17} />}
          label="Wind"
          value={windSpeed}
        />

        <WeatherStat
          icon={<CloudRain size={17} />}
          label="Rainfall"
          value={rainfall}
        />
      </div>

      {/* OUTDOOR SCORE */}
      {outdoorScore !== null && (
        <div
          style={{
            marginTop: "16px",
            padding: "14px",
            borderRadius: "12px",
            background: "#ffffff",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: "600",
              }}
            >
              <Gauge size={18} />
              Outdoor Suitability
            </div>

            <strong>
              {outdoorScore}/100
            </strong>
          </div>

          <div
            style={{
              marginTop: "8px",
              height: "7px",
              borderRadius: "10px",
              background: "#e2e8f0",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, outdoorScore)
                )}%`,
                height: "100%",
                borderRadius: "10px",
                background: "#3b82f6",
              }}
            />
          </div>

          <div
            style={{
              marginTop: "8px",
              fontSize: "13px",
              color: "#64748b",
            }}
          >
            {suitability}
          </div>
        </div>
      )}

      {/* ADVICE */}
      <div
        style={{
          marginTop: "14px",
          padding: "12px 14px",
          borderRadius: "10px",
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          fontSize: "13px",
          lineHeight: "1.5",
        }}
      >
        <strong>Weather advice:</strong>{" "}
        {advice}
      </div>
    </div>
  );
};


// ============================================================
// WEATHER STAT
// ============================================================

const WeatherStat = ({ icon, label, value }) => {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "10px",
        background: "#ffffff",
        border: "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "7px",
          color: "#64748b",
          fontSize: "12px",
          marginBottom: "5px",
        }}
      >
        {icon}
        {label}
      </div>

      <div
        style={{
          fontSize: "15px",
          fontWeight: "700",
        }}
      >
        {value}
      </div>
    </div>
  );
};


// ============================================================
// MAIN ITINERARY COMPONENT
// ============================================================

const Itinerary = ({
  itinerary,
  weather,
  dailyBudget,
  totalBudget,
  currencySymbol,
  destination,
  country,
}) => {

  /*
   * Handle both possible structures:
   *
   * 1. itinerary = [...]
   *
   * 2. itinerary = {
   *      itinerary: [...],
   *      weather: [...]
   *    }
   */
  const itineraryDays = Array.isArray(itinerary)
    ? itinerary
    : itinerary?.itinerary || [];

  /*
   * Weather can come from:
   *
   * 1. weather prop
   * 2. itinerary.weather
   */
  const weatherData = Array.isArray(weather)
    ? weather
    : Array.isArray(itinerary?.weather)
    ? itinerary.weather
    : [];

  if (!itineraryDays.length) {
    return (
      <div
        style={{
          padding: "30px",
          textAlign: "center",
          color: "#64748b",
        }}
      >
        No itinerary available.
      </div>
    );
  }

  return (
    <div>

      {itineraryDays.map((day, index) => {

        /*
         * IMPORTANT:
         *
         * First try weather attached directly
         * to the itinerary day.
         *
         * Then try matching by day number.
         *
         * Finally use the same array index.
         */
        const dayWeather =
          day?.weather ||
          weatherData.find(
            (item) =>
              Number(item?.day) === Number(day?.day)
          ) ||
          weatherData[index] ||
          null;

        return (
          <div
            key={day?.day || index}
            style={{
              marginBottom: "30px",
            }}
          >

            {/* ==================================================
                DAY HEADER
            ================================================== */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  Day {day?.day || index + 1}
                </h2>

                {day?.date && (
                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#64748b",
                    }}
                  >
                    {day.date}
                  </p>
                )}
              </div>
            </div>


            {/* ==================================================
                WEATHER
            ================================================== */}

            {dayWeather ? (
              <WeatherCard
                weather={dayWeather}
              />
            ) : (
              <div
                style={{
                  marginTop: "15px",
                  padding: "15px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                  fontSize: "13px",
                }}
              >
                Weather information is not available
                for this day.
              </div>
            )}


            {/* ==================================================
                ACTIVITIES
            ================================================== */}

            {Array.isArray(day?.activities) &&
              day.activities.map(
                (activity, activityIndex) => {

                  return (
                    <div
                      key={
                        activity?.id ||
                        activityIndex
                      }
                      style={{
                        marginTop: "18px",
                        padding: "18px",
                        borderRadius: "14px",
                        background: "#ffffff",
                        border: "1px solid #e2e8f0",
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                        }}
                      >

                        <MapPin
                          size={20}
                        />

                        <div
                          style={{
                            flex: 1,
                          }}
                        >

                          <h3
                            style={{
                              margin: 0,
                            }}
                          >
                            {activity?.name ||
                              activity?.title ||
                              "Activity"}
                          </h3>

                          {activity?.description && (
                            <p
                              style={{
                                margin:
                                  "6px 0 0",
                                color:
                                  "#64748b",
                              }}
                            >
                              {
                                activity.description
                              }
                            </p>
                          )}

                          <div
                            style={{
                              display: "flex",
                              flexWrap:
                                "wrap",
                              gap: "15px",
                              marginTop:
                                "10px",
                              fontSize:
                                "13px",
                              color:
                                "#64748b",
                            }}
                          >

                            {activity?.duration && (
                              <span
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  gap: "5px",
                                }}
                              >
                                <Clock
                                  size={15}
                                />
                                {
                                  activity.duration
                                }
                              </span>
                            )}

                            {activity?.cost !==
                              undefined && (
                              <span
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  gap: "5px",
                                }}
                              >
                                <Wallet
                                  size={15}
                                />

                                {
                                  currencySymbol
                                }
                                {
                                  activity.cost
                                }
                              </span>
                            )}

                            {activity?.travelTime && (
                              <span
                                style={{
                                  display:
                                    "flex",
                                  alignItems:
                                    "center",
                                  gap: "5px",
                                }}
                              >
                                <Navigation
                                  size={15}
                                />
                                {
                                  activity.travelTime
                                }
                              </span>
                            )}

                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}

          </div>
        );
      })}

    </div>
  );
};

export default Itinerary;