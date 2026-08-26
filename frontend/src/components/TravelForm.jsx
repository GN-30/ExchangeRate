import React, {
  useState,
  useCallback,
  useEffect,
  useRef
} from 'react';

import {
  Send,
  MapPin,
  Calendar,
  Wallet,
  Users
} from 'lucide-react';

import axios from 'axios';

import API_BASE from '../api';


const TravelForm = ({
  onSubmit,
  loading
}) => {

  // =====================================================
  // FORM DATA
  // =====================================================

  const [formData, setFormData] = useState({
    destination: '',
    days: 7,
    budgetINR: 50000,
    travelType: 'budget'
  });


  // =====================================================
  // LOCATION SUGGESTIONS
  // =====================================================

  const [suggestions, setSuggestions] =
    useState([]);

  const [showSuggestions, setShowSuggestions] =
    useState(false);

  const [searchTimeout, setSearchTimeout] =
    useState(null);

  const destinationWrapperRef =
    useRef(null);


  // =====================================================
  // FETCH LOCATION SUGGESTIONS
  // Same approach as Exchange Rate page
  // =====================================================

  const fetchSuggestions =
    useCallback(async (query) => {

      if (
        !query ||
        query.trim().length < 3
      ) {

        setSuggestions([]);
        setShowSuggestions(false);

        return;
      }


      try {

        console.log(
          '[TravelForm] Searching:',
          query
        );


        const response =
          await axios.get(
            `${API_BASE}/search?q=${encodeURIComponent(query)}`,
            {
              timeout: 15000
            }
          );


        console.log(
          '[TravelForm] Search results:',
          response.data
        );


        const results =
          Array.isArray(response.data)
            ? response.data
            : [];


        setSuggestions(
          results
        );


        setShowSuggestions(
          results.length > 0
        );


      } catch (err) {

        console.error(
          '[TravelForm] Suggestion error:',
          err
        );


        setSuggestions([]);

        setShowSuggestions(false);

      }

    }, []);


  // =====================================================
  // HANDLE INPUT CHANGE
  // =====================================================

  const handleChange = (e) => {

    const {
      name,
      value
    } = e.target;


    // Update form

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));


    // Only destination needs autocomplete

    if (
      name !== 'destination'
    ) {
      return;
    }


    // Clear previous timeout

    if (searchTimeout) {

      clearTimeout(
        searchTimeout
      );

    }


    // Don't search below 3 characters

    if (
      value.trim().length < 3
    ) {

      setSuggestions([]);

      setShowSuggestions(false);

      return;
    }


    // Debounce search

    const timeoutId =
      setTimeout(() => {

        fetchSuggestions(
          value.trim()
        );

      }, 500);


    setSearchTimeout(
      timeoutId
    );

  };


  // =====================================================
  // SELECT LOCATION
  // =====================================================

  const handleSelectSuggestion =
    (suggestion) => {

      if (!suggestion) {
        return;
      }


      const destination =
        suggestion.display_name ||
        suggestion.name ||
        '';


      if (!destination) {
        return;
      }


      console.log(
        '[TravelForm] Selected:',
        destination
      );


      setFormData(prev => ({
        ...prev,
        destination
      }));


      setSuggestions([]);

      setShowSuggestions(false);

    };


  // =====================================================
  // CLICK OUTSIDE DROPDOWN
  // =====================================================

  useEffect(() => {

    const handleClickOutside =
      (event) => {

        if (
          destinationWrapperRef.current &&
          !destinationWrapperRef.current.contains(
            event.target
          )
        ) {

          setShowSuggestions(
            false
          );

        }

      };


    document.addEventListener(
      'mousedown',
      handleClickOutside
    );


    return () => {

      document.removeEventListener(
        'mousedown',
        handleClickOutside
      );

    };

  }, []);


  // =====================================================
  // CLEANUP TIMEOUT
  // =====================================================

  useEffect(() => {

    return () => {

      if (searchTimeout) {

        clearTimeout(
          searchTimeout
        );

      }

    };

  }, [searchTimeout]);


  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit =
    (e) => {

      e.preventDefault();


      if (
        !formData.destination.trim()
      ) {

        return;
      }


      setShowSuggestions(false);

      setSuggestions([]);


      console.log(
        '[TravelForm] Submitting:',
        formData
      );


      onSubmit(
        formData
      );

    };


  // =====================================================
  // UI
  // =====================================================

  return (

    <div
      className="glass-card fade-in"
      style={{
        padding: '3rem'
      }}
    >

      {/* =================================================
          HEADER
         ================================================= */}

      <div
        style={{
          marginBottom: '2.5rem'
        }}
      >

        <h2
          className="premium-gradient-text"
          style={{
            fontSize: '2.25rem',
            marginBottom: '0.5rem'
          }}
        >
          Where to next?
        </h2>


        <p
          style={{
            color:
              'var(--text-muted)'
          }}
        >
          Enter your trip details to get an
          AI-powered plan.
        </p>

      </div>


      {/* =================================================
          FORM
         ================================================= */}

      <form
        onSubmit={handleSubmit}
        style={{
          display: 'grid',
          gap: '2rem'
        }}
      >

        <div
          className="grid"
        >

          {/* =================================================
              DESTINATION
             ================================================= */}

          <div
            className="form-group"
            ref={destinationWrapperRef}
            style={{
              position: 'relative',
              zIndex: 100
            }}
          >

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                color:
                  'var(--text-muted)',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >

              <MapPin
                size={16}
                className="text-primary"
              />

              Destination

            </label>


            {/* INPUT */}

            <input
              type="text"
              name="destination"
              value={
                formData.destination
              }
              onChange={
                handleChange
              }
              placeholder="e.g. Paris, Tokyo, Bali"
              autoComplete="off"
              required
            />


            {/* =================================================
                SIMPLE DROPDOWN
                Same style/structure as Exchange Rate
               ================================================= */}

            {showSuggestions &&
              suggestions.length > 0 && (

              <ul
                style={{
                  position:
                    'absolute',

                  top:
                    '100%',

                  left: 0,

                  right: 0,

                  background:
                    'var(--bg-card)',

                  border:
                    '1px solid var(--glass-border)',

                  borderRadius:
                    '1rem',

                  marginTop:
                    '0.5rem',

                  zIndex:
                    9999,

                  maxHeight:
                    '250px',

                  overflowY:
                    'auto',

                  listStyle:
                    'none',

                  padding:
                    '0.5rem 0',

                  boxShadow:
                    '0 8px 32px rgba(0,0,0,0.2)'
                }}
              >

                {suggestions.map(
                  (suggestion, index) => (

                  <li
                    key={index}

                    onClick={() =>
                      handleSelectSuggestion(
                        suggestion
                      )
                    }

                    style={{
                      padding:
                        '0.8rem 1.5rem',

                      cursor:
                        'pointer',

                      borderBottom:
                        index ===
                        suggestions.length - 1
                          ? 'none'
                          : '1px solid var(--glass-border)',

                      fontSize:
                        '0.95rem',

                      transition:
                        'background 0.2s',

                      color:
                        'var(--text-main)',

                      whiteSpace:
                        'nowrap',

                      overflow:
                        'hidden',

                      textOverflow:
                        'ellipsis'
                    }}

                    onMouseEnter={
                      (e) => {

                        e.currentTarget.style.background =
                          'var(--bg-main)';

                      }
                    }

                    onMouseLeave={
                      (e) => {

                        e.currentTarget.style.background =
                          'transparent';

                      }
                    }
                  >

                    {suggestion.display_name ||
                      suggestion.name}

                  </li>

                ))}

              </ul>

            )}

          </div>


          {/* =================================================
              TRIP DURATION
             ================================================= */}

          <div
            className="form-group"
          >

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                color:
                  'var(--text-muted)',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >

              <Calendar
                size={16}
                className="text-accent"
              />

              Trip Duration

            </label>


            <input
              type="number"
              name="days"
              value={
                formData.days
              }
              onChange={
                handleChange
              }
              min="1"
            />

          </div>


          {/* =================================================
              BUDGET
             ================================================= */}

          <div
            className="form-group"
          >

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                color:
                  'var(--text-muted)',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >

              <Wallet
                size={16}
                className="text-accent"
              />

              Budget (INR)

            </label>


            <input
              type="number"
              name="budgetINR"
              value={
                formData.budgetINR
              }
              onChange={
                handleChange
              }
              min="1000"
            />

          </div>


          {/* =================================================
              TRAVEL TYPE
             ================================================= */}

          <div
            className="form-group"
          >

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.75rem',
                color:
                  'var(--text-muted)',
                fontWeight: '600',
                fontSize: '0.9rem'
              }}
            >

              <Users
                size={16}
                className="text-primary"
              />

              Travel Style

            </label>


            <select
              name="travelType"
              value={
                formData.travelType
              }
              onChange={
                handleChange
              }
            >

              <option value="budget">
                Budget Traveler
              </option>

              <option value="luxury">
                Luxury Experience
              </option>

              <option value="family">
                Family Trip
              </option>

              <option value="solo">
                Solo Adventure
              </option>

            </select>

          </div>

        </div>


        {/* =================================================
            SUBMIT BUTTON
           ================================================= */}

        <button
          type="submit"
          disabled={
            loading ||
            !formData.destination.trim()
          }

          style={{
            height: '4rem',
            fontSize: '1.1rem',
            marginTop: '1rem'
          }}
        >

          {loading ? (

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                justifyContent:
                  'center'
              }}
            >

              <span
                className="loader"
              />

              Analyzing Market Data...

            </div>

          ) : (

            <>

              Plan My Journey

              <Send
                size={20}
              />

            </>

          )}

        </button>

      </form>

    </div>

  );
};


export default TravelForm;