import React, {
    useState,
    useEffect,
    useRef
} from 'react';

import {
    Bot,
    Send,
    X,
    Trash2,
    Sparkles,
    Loader2,
    Globe,
    Languages,
    MapPin,
    Wallet,
    Luggage,
    Plane,
    ChevronDown,
    Search,
    Check,
    Copy,
    RotateCcw,
    Square,
    CheckCheck
} from 'lucide-react';

import {
    motion,
    AnimatePresence
} from 'framer-motion';

import API_BASE from '../api';


// ======================================================
// CHATBOT
// ======================================================

const Chatbot = () => {

    const [isOpen, setIsOpen] =
        useState(false);

    const [messages, setMessages] =
        useState([
            {
                text:
                    "Hi! I'm VoyageAI. Ask me about travel, destinations, budgets, currency, packing, or translation.",
                isBot:
                    true
            }
        ]);

    const [input, setInput] =
        useState('');

    const [isThinking, setIsThinking] =
        useState(false);


    // ==================================================
    // LANGUAGE
    // ==================================================

    const [language, setLanguage] =
        useState('English');

    const [isLanguageOpen, setIsLanguageOpen] =
        useState(false);

    const [languageSearch, setLanguageSearch] =
        useState('');


    // ==================================================
    // TRANSLATION
    // ==================================================

    const [translate, setTranslate] =
        useState(false);


    // ==================================================
    // COPY
    // ==================================================

    const [copiedIndex, setCopiedIndex] =
        useState(null);


    // ==================================================
    // RETRY
    // ==================================================

    const [retryingIndex, setRetryingIndex] =
        useState(null);


    // ==================================================
    // REFS
    // ==================================================

    const messagesEndRef =
        useRef(null);

    const languageMenuRef =
        useRef(null);

    const abortControllerRef =
        useRef(null);


    // ==================================================
    // LANGUAGES
    // ==================================================

    const languages = [

        {
            name: 'English',
            native: 'English'
        },

        {
            name: 'Tamil',
            native: 'தமிழ்'
        },

        {
            name: 'Hindi',
            native: 'हिन्दी'
        },

        {
            name: 'Telugu',
            native: 'తెలుగు'
        },

        {
            name: 'Kannada',
            native: 'ಕನ್ನಡ'
        },

        {
            name: 'Malayalam',
            native: 'മലയാളം'
        },

        {
            name: 'Bengali',
            native: 'বাংলা'
        },

        {
            name: 'Marathi',
            native: 'मराठी'
        },

        {
            name: 'Gujarati',
            native: 'ગુજરાતી'
        },

        {
            name: 'Punjabi',
            native: 'ਪੰਜਾਬੀ'
        },

        {
            name: 'Odia',
            native: 'ଓଡ଼ିଆ'
        },

        {
            name: 'Urdu',
            native: 'اردو'
        },

        {
            name: 'French',
            native: 'Français'
        },

        {
            name: 'Spanish',
            native: 'Español'
        },

        {
            name: 'German',
            native: 'Deutsch'
        },

        {
            name: 'Italian',
            native: 'Italiano'
        },

        {
            name: 'Japanese',
            native: '日本語'
        },

        {
            name: 'Korean',
            native: '한국어'
        },

        {
            name: 'Chinese',
            native: '中文'
        },

        {
            name: 'Arabic',
            native: 'العربية'
        },

        {
            name: 'Portuguese',
            native: 'Português'
        },

        {
            name: 'Russian',
            native: 'Русский'
        }

    ];


    // ==================================================
    // SUGGESTIONS
    // ==================================================

    const suggestedPrompts = [

        {
            text:
                'Best places for this weekend',

            icon:
                MapPin
        },

        {
            text:
                'Plan a trip under ₹30,000',

            icon:
                Wallet
        },

        {
            text:
                'What should I pack for my trip?',

            icon:
                Luggage
        },

        {
            text:
                'Which destination is best for a family trip?',

            icon:
                Plane
        }

    ];


    // ==================================================
    // FILTER LANGUAGES
    // ==================================================

    const filteredLanguages =
        languages.filter(

            lang =>

                `${lang.name} ${lang.native}`
                    .toLowerCase()
                    .includes(
                        languageSearch.toLowerCase()
                    )

        );


    // ==================================================
    // AUTO SCROLL
    // ==================================================

    useEffect(() => {

        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth'
        });

    }, [messages]);


    // ==================================================
    // CLOSE LANGUAGE MENU
    // ==================================================

    useEffect(() => {

        const handleOutsideClick =
            event => {

                if (
                    languageMenuRef.current &&
                    !languageMenuRef.current.contains(
                        event.target
                    )
                ) {

                    setIsLanguageOpen(false);
                    setLanguageSearch('');

                }

            };


        document.addEventListener(
            'mousedown',
            handleOutsideClick
        );


        return () => {

            document.removeEventListener(
                'mousedown',
                handleOutsideClick
            );

        };

    }, []);


    // ==================================================
    // STREAM RESPONSE
    // ==================================================

    const streamResponse = async ({
        userMessage,
        history,
        assistantIndex
    }) => {

        const controller =
            new AbortController();

        abortControllerRef.current =
            controller;


        const token =
            sessionStorage.getItem('token');


        const headers = {

            'Content-Type':
                'application/json',

            'Accept':
                'text/event-stream'

        };


        if (token) {

            headers.Authorization =
                `Bearer ${token}`;

        }


        const response =
            await fetch(

                `${API_BASE}/chat`,

                {

                    method:
                        'POST',

                    headers,

                    body:
                        JSON.stringify({

                            message:
                                userMessage,

                            history:
                                history,

                            language:
                                language,

                            translate:
                                translate

                        }),

                    signal:
                        controller.signal

                }

            );


        if (!response.ok) {

            let errorMessage =
                'Failed to connect to VoyageAI.';


            try {

                const errorData =
                    await response.json();

                errorMessage =
                    errorData?.error ||
                    errorMessage;

            } catch (error) {
                // Ignore parsing error
            }


            throw new Error(
                errorMessage
            );

        }


        if (!response.body) {

            throw new Error(
                'Streaming is not supported by this browser.'
            );

        }


        const reader =
            response.body.getReader();

        const decoder =
            new TextDecoder('utf-8');


        let buffer =
            '';

        let fullText =
            '';


        // ==================================================
        // APPEND TEXT
        // ==================================================

        const appendText = text => {

            if (!text) {
                return;
            }


            fullText +=
                text;


            setMessages(
                previous => {

                    const updated =
                        [...previous];


                    if (
                        !updated[
                            assistantIndex
                        ]
                    ) {

                        return updated;

                    }


                    updated[
                        assistantIndex
                    ] = {

                        ...updated[
                            assistantIndex
                        ],

                        text:
                            fullText,

                        isBot:
                            true,

                        streaming:
                            true,

                        error:
                            false

                    };


                    return updated;

                }
            );

        };


        // ==================================================
        // PROCESS SSE EVENT
        // ==================================================

        const processEvent =
            eventBlock => {

                if (
                    !eventBlock.trim()
                ) {

                    return;

                }


                let eventName =
                    'message';

                let dataText =
                    '';


                const lines =
                    eventBlock.split(
                        /\r?\n/
                    );


                for (
                    const line of lines
                ) {

                    if (
                        line.startsWith(
                            'event:'
                        )
                    ) {

                        eventName =
                            line
                                .slice(6)
                                .trim();

                    }


                    if (
                        line.startsWith(
                            'data:'
                        )
                    ) {

                        dataText +=
                            line
                                .slice(5)
                                .trim();

                    }

                }


                if (
                    !dataText
                ) {

                    return;

                }


                let data;


                try {

                    data =
                        JSON.parse(
                            dataText
                        );

                } catch (error) {

                    console.error(
                        '[Chatbot] SSE parsing error:',
                        dataText
                    );

                    return;

                }


                // ==========================================
                // CHUNK
                // ==========================================

                if (
                    eventName === 'chunk'
                ) {

                    appendText(
                        data?.text || ''
                    );

                }


                // ==========================================
                // ERROR
                // ==========================================

                if (
                    eventName === 'error'
                ) {

                    throw new Error(

                        data?.error ||
                        'VoyageAI failed to generate a response.'

                    );

                }

            };


        // ==================================================
        // READ STREAM
        // ==================================================

        while (true) {

            const {
                value,
                done
            } =
                await reader.read();


            if (done) {
                break;
            }


            buffer +=
                decoder.decode(
                    value,
                    {
                        stream:
                            true
                    }
                );


            const events =
                buffer.split(
                    /\r?\n\r?\n/
                );


            buffer =
                events.pop() || '';


            for (
                const eventBlock of events
            ) {

                processEvent(
                    eventBlock
                );

            }

        }


        // ==================================================
        // FINAL BUFFER
        // ==================================================

        buffer +=
            decoder.decode();


        if (
            buffer.trim()
        ) {

            processEvent(
                buffer
            );

        }


        // ==================================================
        // FINISH
        // ==================================================

        setMessages(
            previous => {

                const updated =
                    [...previous];


                if (
                    updated[
                        assistantIndex
                    ]
                ) {

                    updated[
                        assistantIndex
                    ] = {

                        ...updated[
                            assistantIndex
                        ],

                        text:
                            fullText,

                        streaming:
                            false,

                        error:
                            false

                    };

                }


                return updated;

            }
        );


        abortControllerRef.current =
            null;

    };

    const clearChat = () => {
    const confirmed = window.confirm(
        'Are you sure you want to clear this conversation?'
    );

    if (!confirmed) return;

    // Stop any active response
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
    }

    setIsThinking(false);

    // Reset conversation
    setMessages([
        {
            text:
                "Hi! I'm VoyageAI. Ask me about travel, destinations, budgets, currency, packing, or translation.",
            isBot: true
        }
    ]);

    setCopiedIndex(null);
    setRetryingIndex(null);
};


    // ==================================================
    // SEND MESSAGE
    // ==================================================

    const sendMessage = async event => {

        event.preventDefault();


        if (
            !input.trim() ||
            isThinking
        ) {

            return;

        }


        const userMessage =
            input.trim();


        // ==================================================
        // HISTORY
        // ==================================================

        const history =
            messages.map(
                message => ({

                    role:
                        message.isBot
                            ? 'assistant'
                            : 'user',

                    text:
                        message.text

                })
            );


        // ==================================================
        // ASSISTANT INDEX
        // ==================================================

        const assistantIndex =
            messages.length + 1;


        // ==================================================
        // ADD USER + ASSISTANT
        // ==================================================

        setMessages(
            previous => [

                ...previous,

                {

                    text:
                        userMessage,

                    isBot:
                        false

                },

                {

                    text:
                        '',

                    isBot:
                        true,

                    streaming:
                        true,

                    error:
                        false

                }

            ]
        );


        setInput('');

        setIsThinking(true);


        try {

            await streamResponse({

                userMessage,

                history,

                assistantIndex

            });

        } catch (error) {

            console.error(
                '[Chatbot] Stream error:',
                error
            );


            if (
                error?.name !==
                'AbortError'
            ) {

                setMessages(
                    previous => {

                        const updated =
                            [...previous];


                        if (
                            updated[
                                assistantIndex
                            ]
                        ) {

                            updated[
                                assistantIndex
                            ] = {

                                ...updated[
                                    assistantIndex
                                ],

                                text:
                                    error?.message ||
                                    'Sorry, I could not generate a response.',

                                streaming:
                                    false,

                                error:
                                    true

                            };

                        }


                        return updated;

                    }
                );

            }

        } finally {

            setIsThinking(false);

            abortControllerRef.current =
                null;

        }

    };


    // ==================================================
    // STOP
    // ==================================================

    const stopGenerating = () => {

        if (
            abortControllerRef.current
        ) {

            abortControllerRef.current.abort();

            abortControllerRef.current =
                null;

        }


        setIsThinking(false);


        setMessages(
            previous => {

                const updated =
                    [...previous];


                for (
                    let i =
                        updated.length - 1;

                    i >= 0;

                    i--
                ) {

                    if (
                        updated[i]?.isBot &&
                        updated[i]?.streaming
                    ) {

                        updated[i] = {

                            ...updated[i],

                            streaming:
                                false

                        };


                        break;

                    }

                }


                return updated;

            }
        );

    };


    // ==================================================
    // COPY
    // ==================================================

    const copyResponse = async (
        text,
        index
    ) => {

        if (!text) {
            return;
        }


        try {

            await navigator.clipboard.writeText(
                text
            );


            setCopiedIndex(
                index
            );


            setTimeout(
                () => {

                    setCopiedIndex(null);

                },
                1500
            );

        } catch (error) {

            console.error(
                'Copy failed:',
                error
            );

        }

    };


    // ==================================================
    // REGENERATE
    // ==================================================

    const regenerateResponse = async (
        assistantIndex
    ) => {

        if (isThinking) {
            return;
        }


        const userIndex =
            assistantIndex - 1;


        if (
            userIndex < 0 ||
            !messages[userIndex] ||
            messages[userIndex].isBot
        ) {

            return;

        }


        const userMessage =
            messages[
                userIndex
            ].text;


        const history =
            messages
                .slice(
                    0,
                    userIndex
                )
                .map(
                    message => ({

                        role:
                            message.isBot
                                ? 'assistant'
                                : 'user',

                        text:
                            message.text

                    })
                );


        setMessages(
            previous => {

                const updated =
                    [...previous];


                updated[
                    assistantIndex
                ] = {

                    text:
                        '',

                    isBot:
                        true,

                    streaming:
                        true,

                    error:
                        false

                };


                return updated;

            }
        );


        setIsThinking(true);

        setRetryingIndex(
            assistantIndex
        );


        try {

            await streamResponse({

                userMessage,

                history,

                assistantIndex

            });

        } catch (error) {

            if (
                error?.name !==
                'AbortError'
            ) {

                setMessages(
                    previous => {

                        const updated =
                            [...previous];


                        updated[
                            assistantIndex
                        ] = {

                            ...updated[
                                assistantIndex
                            ],

                            text:
                                error?.message ||
                                'Unable to regenerate response.',

                            streaming:
                                false,

                            error:
                                true

                        };


                        return updated;

                    }
                );

            }

        } finally {

            setIsThinking(false);

            setRetryingIndex(null);

            abortControllerRef.current =
                null;

        }

    };


    // ==================================================
    // TRY AGAIN
    // ==================================================

    const retryResponse = async index => {

        await regenerateResponse(
            index
        );

    };


    // ==================================================
    // SUGGESTED PROMPT
    // ==================================================

    const useSuggestedPrompt = prompt => {

        if (isThinking) {
            return;
        }


        setInput(
            prompt
        );

    };


    // ==================================================
    // SELECTED LANGUAGE
    // ==================================================

    const selectedLanguage =
        languages.find(
            lang =>
                lang.name === language
        );


    // ==================================================
    // UI
    // ==================================================

    return (

        <div

            style={{
                position:
                    'fixed',

                bottom:
                    '2rem',

                right:
                    '2rem',

                zIndex:
                    9999
            }}

        >

            <AnimatePresence>

                {isOpen && (

                    <motion.div

                        initial={{
                            opacity:
                                0,

                            scale:
                                0.85,

                            y:
                                30
                        }}

                        animate={{
                            opacity:
                                1,

                            scale:
                                1,

                            y:
                                0
                        }}

                        exit={{
                            opacity:
                                0,

                            scale:
                                0.85,

                            y:
                                30
                        }}

                        transition={{
                            type:
                                'spring',

                            stiffness:
                                320,

                            damping:
                                25
                        }}

                        className="glass-card"

                        style={{
                            width:
                                '390px',

                            height:
                                '570px',

                            marginBottom:
                                '1rem',

                            display:
                                'flex',

                            flexDirection:
                                'column',

                            padding:
                                0,

                            overflow:
                                'hidden',

                            boxShadow:
                                '0 25px 70px rgba(0,0,0,0.35)',

                            borderRadius:
                                '1.5rem',

                            maxWidth:
                                'calc(100vw - 2rem)',

                            maxHeight:
                                'calc(100vh - 3rem)'
                        }}

                    >

                        {/* ==================================================
                            HEADER
                        ================================================== */}

                        <div

                            style={{
                                background:
                                    'var(--btn-gradient)',

                                padding:
                                    '1rem 1.15rem',

                                display:
                                    'flex',

                                justifyContent:
                                    'space-between',

                                alignItems:
                                    'center',

                                color:
                                    '#ffffff'
                            }}

                        >

                            <div

                                style={{
                                    display:
                                        'flex',

                                    alignItems:
                                        'center',

                                    gap:
                                        '0.7rem'
                                }}

                            >

                                <motion.div

                                    animate={{
                                        y:
                                            [
                                                0,
                                                -3,
                                                0
                                            ],

                                        rotate:
                                            [
                                                0,
                                                -3,
                                                3,
                                                0
                                            ]
                                    }}

                                    transition={{
                                        duration:
                                            2.5,

                                        repeat:
                                            Infinity
                                    }}

                                    style={{
                                        width:
                                            '40px',

                                        height:
                                            '40px',

                                        borderRadius:
                                            '12px',

                                        background:
                                            'rgba(255,255,255,0.2)',

                                        display:
                                            'flex',

                                        alignItems:
                                            'center',

                                        justifyContent:
                                            'center'
                                    }}

                                >

                                    <Bot
                                        size={23}
                                        strokeWidth={2.5}
                                    />

                                </motion.div>


                                <div>

                                    <div

                                        style={{
                                            display:
                                                'flex',

                                            alignItems:
                                                'center',

                                            gap:
                                                '0.3rem'
                                        }}

                                    >

                                        <h3

                                            style={{
                                                margin:
                                                    0,

                                                fontSize:
                                                    '1.05rem',

                                                color:
                                                    '#ffffff',

                                                fontWeight:
                                                    '800'
                                            }}

                                        >

                                            VoyageAI

                                        </h3>


                                        <Sparkles
                                            size={14}
                                        />

                                    </div>


                                    <div

                                        style={{
                                            display:
                                                'flex',

                                            alignItems:
                                                'center',

                                            gap:
                                                '0.35rem',

                                            fontSize:
                                                '0.68rem',

                                            marginTop:
                                                '2px',

                                            color:
                                                '#ffffff'
                                        }}

                                    >

                                        <motion.span

                                            animate={{
                                                scale:
                                                    isThinking
                                                        ? [
                                                            1,
                                                            1.5,
                                                            1
                                                        ]
                                                        : 1
                                            }}

                                            transition={{
                                                duration:
                                                    1,

                                                repeat:
                                                    isThinking
                                                        ? Infinity
                                                        : 0
                                            }}

                                            style={{
                                                width:
                                                    '6px',

                                                height:
                                                    '6px',

                                                borderRadius:
                                                    '50%',

                                                background:
                                                    '#ffffff',

                                                display:
                                                    'inline-block'
                                            }}

                                        />

                                        {isThinking
                                            ? 'Generating response...'
                                            : 'Ready to help'}

                                    </div>

                                </div>

                            </div>
                            <motion.button
    type="button"
    onClick={clearChat}
    whileHover={{
        scale: 1.05,
        y: -1
    }}
    whileTap={{
        scale: 0.94
    }}
    title="Clear conversation"
    aria-label="Clear conversation"
    style={{
        minWidth: '72px',
        height: '34px',
        border: '1px solid rgba(255,255,255,0.35)',
        borderRadius: '17px',
        background: 'rgba(255,255,255,0.14)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.3rem',
        cursor: 'pointer',
        fontSize: '0.68rem',
        fontWeight: '800',
        backdropFilter: 'blur(10px)'
    }}
>
    <Trash2
        size={15}
        strokeWidth={2.5}
    />

    
</motion.button>


                            {/* ==================================================
                                CLOSE BUTTON
                            ================================================== */}

                            <motion.button

                                type="button"

                                onClick={() =>
                                    setIsOpen(
                                        false
                                    )
                                }

                                whileHover={{
                                    scale:
                                        1.08,

                                    rotate:
                                        0
                                }}

                                whileTap={{
                                    scale:
                                        0.9
                                }}

                                aria-label="Close chatbot"

                                title="Close chatbot"

                                style={{
                                    minWidth:
                                        '78px',

                                    height:
                                        '34px',

                                    border:
                                        '1px solid rgba(255,255,255,0.4)',

                                    borderRadius:
                                        '17px',

                                    background:
                                        'rgba(255,255,255,0.16)',

                                    color:
                                        '#ffffff',

                                    display:
                                        'flex',

                                    alignItems:
                                        'center',

                                    justifyContent:
                                        'center',

                                    gap:
                                        '0.35rem',

                                    cursor:
                                        'pointer',

                                    fontSize:
                                        '0.7rem',

                                    fontWeight:
                                        '800',

                                    backdropFilter:
                                        'blur(10px)'
                                }}

                            >

                                <X
                                    size={17}
                                    strokeWidth={3}
                                />

                                

                            </motion.button>

                        </div>


                        {/* ==================================================
                            LANGUAGE BAR
                        ================================================== */}

                        <div

                            style={{
                                padding:
                                    '0.65rem 0.8rem',

                                display:
                                    'flex',

                                gap:
                                    '0.5rem',

                                borderBottom:
                                    '1px solid var(--glass-border)',

                                background:
                                    'var(--bg-card)',

                                position:
                                    'relative',

                                zIndex:
                                    50
                            }}

                        >

                            {/* LANGUAGE */}

                            <div

                                ref={
                                    languageMenuRef
                                }

                                style={{
                                    position:
                                        'relative',

                                    flex:
                                        1
                                }}

                            >

                                <motion.button

                                    type="button"

                                    onClick={() =>
                                        setIsLanguageOpen(
                                            previous =>
                                                !previous
                                        )
                                    }

                                    whileHover={{
                                        scale:
                                            1.02
                                    }}

                                    whileTap={{
                                        scale:
                                            0.97
                                    }}

                                    style={{
                                        width:
                                            '100%',

                                        height:
                                            '2.45rem',

                                        borderRadius:
                                            '1.3rem',

                                        border:
                                            '1px solid var(--glass-border)',

                                        background:
                                            'var(--bg-main)',

                                        color:
                                            'var(--text-main)',

                                        display:
                                            'flex',

                                        alignItems:
                                            'center',

                                        gap:
                                            '0.4rem',

                                        padding:
                                            '0 0.75rem',

                                        cursor:
                                            'pointer'
                                    }}

                                >

                                    <Globe
                                        size={15}
                                    />

                                    <span

                                        style={{
                                            fontSize:
                                                '0.72rem',

                                            fontWeight:
                                                '800'
                                        }}

                                    >
                                        Language
                                    </span>


                                    <span

                                        style={{
                                            flex:
                                                1,

                                            textAlign:
                                                'right',

                                            fontSize:
                                                '0.68rem',

                                            opacity:
                                                0.7
                                        }}

                                    >

                                        {
                                            selectedLanguage?.native
                                        }

                                    </span>


                                    <motion.div

                                        animate={{
                                            rotate:
                                                isLanguageOpen
                                                    ? 180
                                                    : 0
                                        }}

                                    >

                                        <ChevronDown
                                            size={15}
                                        />

                                    </motion.div>

                                </motion.button>


                                {/* LANGUAGE DROPDOWN */}

                                <AnimatePresence>

                                    {isLanguageOpen && (

                                        <motion.div

                                            initial={{
                                                opacity:
                                                    0,

                                                y:
                                                    -8,

                                                scale:
                                                    0.96
                                            }}

                                            animate={{
                                                opacity:
                                                    1,

                                                y:
                                                    5,

                                                scale:
                                                    1
                                            }}

                                            exit={{
                                                opacity:
                                                    0,

                                                y:
                                                    -8,

                                                scale:
                                                    0.96
                                            }}

                                            style={{
                                                position:
                                                    'absolute',

                                                top:
                                                    '100%',

                                                left:
                                                    0,

                                                right:
                                                    0,

                                                zIndex:
                                                    100,

                                                padding:
                                                    '0.5rem',

                                                borderRadius:
                                                    '1rem',

                                                background:
                                                    'var(--bg-card)',

                                                border:
                                                    '1px solid var(--glass-border)',

                                                boxShadow:
                                                    '0 20px 50px rgba(0,0,0,0.25)'
                                            }}

                                        >

                                            <div

                                                style={{
                                                    position:
                                                        'relative',

                                                    marginBottom:
                                                        '0.4rem'
                                                }}

                                            >

                                                <Search

                                                    size={14}

                                                    style={{
                                                        position:
                                                            'absolute',

                                                        left:
                                                            '0.6rem',

                                                        top:
                                                            '50%',

                                                        transform:
                                                            'translateY(-50%)',

                                                        opacity:
                                                            0.5
                                                    }}

                                                />


                                                <input

                                                    value={
                                                        languageSearch
                                                    }

                                                    onChange={
                                                        e =>
                                                            setLanguageSearch(
                                                                e.target.value
                                                            )
                                                    }

                                                    placeholder="Search language..."

                                                    style={{
                                                        width:
                                                            '100%',

                                                        height:
                                                            '2.1rem',

                                                        boxSizing:
                                                            'border-box',

                                                        padding:
                                                            '0 0.6rem 0 2rem',

                                                        borderRadius:
                                                            '0.7rem',

                                                        border:
                                                            '1px solid var(--glass-border)',

                                                        outline:
                                                            'none',

                                                        background:
                                                            'var(--bg-main)',

                                                        color:
                                                            'var(--text-main)'
                                                    }}

                                                />

                                            </div>


                                            <div

                                                style={{
                                                    maxHeight:
                                                        '230px',

                                                    overflowY:
                                                        'auto'
                                                }}

                                            >

                                                {filteredLanguages.map(
                                                    lang => {

                                                        const selected =
                                                            language ===
                                                            lang.name;


                                                        return (

                                                            <motion.button

                                                                key={
                                                                    lang.name
                                                                }

                                                                type="button"

                                                                whileHover={{
                                                                    x:
                                                                        3
                                                                }}

                                                                onClick={() => {

                                                                    setLanguage(
                                                                        lang.name
                                                                    );

                                                                    setIsLanguageOpen(
                                                                        false
                                                                    );

                                                                    setLanguageSearch(
                                                                        ''
                                                                    );

                                                                }}

                                                                style={{
                                                                    width:
                                                                        '100%',

                                                                    border:
                                                                        'none',

                                                                    borderRadius:
                                                                        '0.7rem',

                                                                    padding:
                                                                        '0.55rem',

                                                                    background:
                                                                        selected
                                                                            ? 'var(--btn-gradient)'
                                                                            : 'transparent',

                                                                    color:
                                                                        selected
                                                                            ? '#ffffff'
                                                                            : 'var(--text-main)',

                                                                    display:
                                                                        'flex',

                                                                    alignItems:
                                                                        'center',

                                                                    gap:
                                                                        '0.5rem',

                                                                    cursor:
                                                                        'pointer',

                                                                    textAlign:
                                                                        'left'
                                                                }}

                                                            >

                                                                <Globe
                                                                    size={14}
                                                                />


                                                                <span

                                                                    style={{
                                                                        flex:
                                                                            1,

                                                                        display:
                                                                            'flex',

                                                                        flexDirection:
                                                                            'column'
                                                                    }}

                                                                >

                                                                    <span

                                                                        style={{
                                                                            fontWeight:
                                                                                '700',

                                                                            fontSize:
                                                                                '0.75rem'
                                                                        }}

                                                                    >

                                                                        {
                                                                            lang.native
                                                                        }

                                                                    </span>


                                                                    <span

                                                                        style={{
                                                                            fontSize:
                                                                                '0.62rem',

                                                                            opacity:
                                                                                0.7
                                                                        }}

                                                                    >

                                                                        {
                                                                            lang.name
                                                                        }

                                                                    </span>

                                                                </span>


                                                                {selected && (

                                                                    <Check
                                                                        size={15}
                                                                    />

                                                                )}

                                                            </motion.button>

                                                        );

                                                    }

                                                )}

                                            </div>

                                        </motion.div>

                                    )}

                                </AnimatePresence>

                            </div>


                            {/* TRANSLATE */}

                            <motion.button

                                type="button"

                                onClick={() =>
                                    setTranslate(
                                        previous =>
                                            !previous
                                    )
                                }

                                whileHover={{
                                    scale:
                                        1.03,

                                    y:
                                        -1
                                }}

                                whileTap={{
                                    scale:
                                        0.95
                                }}

                                style={{
                                    height:
                                        '2.45rem',

                                    padding:
                                        '0 0.8rem',

                                    borderRadius:
                                        '1.3rem',

                                    border:
                                        '1px solid var(--glass-border)',

                                    background:
                                        translate
                                            ? 'var(--btn-gradient)'
                                            : 'var(--bg-main)',

                                    color:
                                        translate
                                            ? '#ffffff'
                                            : 'var(--text-main)',

                                    display:
                                        'flex',

                                    alignItems:
                                        'center',

                                    justifyContent:
                                        'center',

                                    gap:
                                        '0.35rem',

                                    cursor:
                                        'pointer',

                                    fontSize:
                                        '0.7rem',

                                    fontWeight:
                                        '800'
                                }}

                            >

                                <Languages
                                    size={15}
                                />

                                <span>
                                    Translate
                                </span>

                                <span

                                    style={{
                                        fontSize:
                                            '0.58rem',

                                        padding:
                                            '2px 5px',

                                        borderRadius:
                                            '6px',

                                        background:
                                            translate
                                                ? 'rgba(255,255,255,0.2)'
                                                : 'rgba(127,127,127,0.12)'
                                    }}

                                >

                                    {translate
                                        ? 'ON'
                                        : 'OFF'}

                                </span>

                            </motion.button>

                        </div>


                        {/* ==================================================
                            CHAT AREA
                        ================================================== */}

                        <div

                            style={{
                                flex:
                                    1,

                                overflowY:
                                    'auto',

                                padding:
                                    '1rem',

                                display:
                                    'flex',

                                flexDirection:
                                    'column',

                                gap:
                                    '0.8rem'
                            }}

                        >

                            {/* SUGGESTIONS */}

                            {messages.length === 1 &&
                                !isThinking && (

                                    <motion.div

                                        initial={{
                                            opacity:
                                                0,

                                            y:
                                                10
                                        }}

                                        animate={{
                                            opacity:
                                                1,

                                            y:
                                                0
                                        }}

                                    >

                                        <div

                                            style={{
                                                display:
                                                    'flex',

                                                alignItems:
                                                    'center',

                                                gap:
                                                    '0.35rem',

                                                marginBottom:
                                                    '0.6rem',

                                                fontSize:
                                                    '0.75rem',

                                                fontWeight:
                                                    '800',

                                                opacity:
                                                    0.7
                                            }}

                                        >

                                            <Sparkles
                                                size={13}
                                            />

                                            Try asking VoyageAI

                                        </div>


                                        {suggestedPrompts.map(
                                            (
                                                prompt,
                                                index
                                            ) => {

                                                const Icon =
                                                    prompt.icon;


                                                return (

                                                    <motion.button

                                                        key={
                                                            index
                                                        }

                                                        type="button"

                                                        initial={{
                                                            opacity:
                                                                0,

                                                            x:
                                                                -10
                                                        }}

                                                        animate={{
                                                            opacity:
                                                                1,

                                                            x:
                                                                0
                                                        }}

                                                        transition={{
                                                            delay:
                                                                index *
                                                                0.08
                                                        }}

                                                        whileHover={{
                                                            scale:
                                                                1.015,

                                                            x:
                                                                2
                                                        }}

                                                        whileTap={{
                                                            scale:
                                                                0.98
                                                        }}

                                                        onClick={() =>
                                                            useSuggestedPrompt(
                                                                prompt.text
                                                            )
                                                        }

                                                        style={{
                                                            width:
                                                                '100%',

                                                            marginBottom:
                                                                '0.45rem',

                                                            borderRadius:
                                                                '0.85rem',

                                                            padding:
                                                                '0.6rem',

                                                            border:
                                                                '1px solid var(--glass-border)',

                                                            background:
                                                                'var(--bg-card)',

                                                            color:
                                                                'var(--text-main)',

                                                            display:
                                                                'flex',

                                                            alignItems:
                                                                'center',

                                                            gap:
                                                                '0.55rem',

                                                            cursor:
                                                                'pointer',

                                                            textAlign:
                                                                'left'
                                                        }}

                                                    >

                                                        <span

                                                            style={{
                                                                width:
                                                                    '30px',

                                                                height:
                                                                    '30px',

                                                                minWidth:
                                                                    '30px',

                                                                borderRadius:
                                                                    '8px',

                                                                display:
                                                                    'flex',

                                                                alignItems:
                                                                    'center',

                                                                justifyContent:
                                                                    'center',

                                                                background:
                                                                    'var(--btn-gradient)',

                                                                color:
                                                                    '#ffffff'
                                                            }}

                                                        >

                                                            <Icon
                                                                size={15}
                                                            />

                                                        </span>


                                                        <span

                                                            style={{
                                                                fontSize:
                                                                    '0.76rem',

                                                                fontWeight:
                                                                    '650'
                                                            }}

                                                        >

                                                            {
                                                                prompt.text
                                                            }

                                                        </span>

                                                    </motion.button>

                                                );

                                            }

                                        )}

                                    </motion.div>

                                )}


                            {/* MESSAGES */}

                            <AnimatePresence
                                initial={false}
                            >

                                {messages.map(
                                    (
                                        message,
                                        index
                                    ) => {

                                        const showActions =
                                            message.isBot &&
                                            message.text &&
                                            !message.streaming;


                                        return (

                                            <motion.div

                                                key={
                                                    index
                                                }

                                                initial={{
                                                    opacity:
                                                        0,

                                                    y:
                                                        12,

                                                    scale:
                                                        0.98
                                                }}

                                                animate={{
                                                    opacity:
                                                        1,

                                                    y:
                                                        0,

                                                    scale:
                                                        1
                                                }}

                                                style={{
                                                    alignSelf:
                                                        message.isBot
                                                            ? 'flex-start'
                                                            : 'flex-end',

                                                    maxWidth:
                                                        '90%',

                                                    display:
                                                        'flex',

                                                    flexDirection:
                                                        'column',

                                                    alignItems:
                                                        message.isBot
                                                            ? 'flex-start'
                                                            : 'flex-end'
                                                }}

                                            >

                                                {/* MESSAGE */}

                                                <div

                                                    style={{
                                                        padding:
                                                            '0.85rem 1rem',

                                                        borderRadius:
                                                            '1.2rem',

                                                        background:
                                                            message.isBot
                                                                ? 'var(--bg-main)'
                                                                : 'var(--btn-gradient)',

                                                        color:
                                                            message.isBot
                                                                ? 'var(--text-main)'
                                                                : '#ffffff',

                                                        border:
                                                            message.isBot
                                                                ? '1px solid var(--glass-border)'
                                                                : 'none',

                                                        borderBottomLeftRadius:
                                                            message.isBot
                                                                ? 0
                                                                : '1.2rem',

                                                        borderBottomRightRadius:
                                                            !message.isBot
                                                                ? 0
                                                                : '1.2rem',

                                                        lineHeight:
                                                            '1.55',

                                                        fontSize:
                                                            '0.9rem',

                                                        whiteSpace:
                                                            'pre-wrap',

                                                        boxShadow:
                                                            '0 4px 15px rgba(0,0,0,0.07)'
                                                    }}

                                                >

                                                    {message.isBot && (

                                                        <Bot

                                                            size={14}

                                                            strokeWidth={2.5}

                                                            style={{
                                                                marginRight:
                                                                    '5px',

                                                                verticalAlign:
                                                                    'middle'
                                                            }}

                                                        />

                                                    )}


                                                    {message.text}


                                                    {/* STREAMING CURSOR */}

                                                    {message.streaming && (

                                                        <motion.span

                                                            animate={{
                                                                opacity:
                                                                    [
                                                                        0,
                                                                        1,
                                                                        0
                                                                    ]
                                                            }}

                                                            transition={{
                                                                duration:
                                                                    0.8,

                                                                repeat:
                                                                    Infinity
                                                            }}

                                                            style={{
                                                                display:
                                                                    'inline-block',

                                                                width:
                                                                    '5px',

                                                                height:
                                                                    '16px',

                                                                marginLeft:
                                                                    '4px',

                                                                verticalAlign:
                                                                    'middle',

                                                                background:
                                                                    'currentColor',

                                                                borderRadius:
                                                                    '2px'
                                                            }}

                                                        />

                                                    )}

                                                </div>


                                                {/* ==================================================
                                                    RESPONSE ACTIONS
                                                ================================================== */}

                                                {showActions && (

                                                    <motion.div

                                                        initial={{
                                                            opacity:
                                                                0,

                                                            y:
                                                                -3
                                                        }}

                                                        animate={{
                                                            opacity:
                                                                1,

                                                            y:
                                                                0
                                                        }}

                                                        style={{
                                                            display:
                                                                'flex',

                                                            alignItems:
                                                                'center',

                                                            gap:
                                                                '0.35rem',

                                                            marginTop:
                                                                '0.4rem',

                                                            padding:
                                                                '0.25rem',

                                                            borderRadius:
                                                                '0.7rem',

                                                            background:
                                                                'rgba(127,127,127,0.06)'
                                                        }}

                                                    >

                                                        {/* COPY */}

                                                        <motion.button

                                                            type="button"

                                                            whileHover={{
                                                                scale:
                                                                    1.04,

                                                                y:
                                                                    -1
                                                            }}

                                                            whileTap={{
                                                                scale:
                                                                    0.94
                                                            }}

                                                            onClick={() =>
                                                                copyResponse(
                                                                    message.text,
                                                                    index
                                                                )
                                                            }

                                                            title="Copy response"

                                                            aria-label="Copy response"

                                                            style={{
                                                                height:
                                                                    '30px',

                                                                padding:
                                                                    '0 0.7rem',

                                                                borderRadius:
                                                                    '0.6rem',

                                                                border:
                                                                    '1px solid var(--glass-border)',

                                                                background:
                                                                    'var(--bg-card)',

                                                                color:
                                                                    'var(--text-main)',

                                                                display:
                                                                    'flex',

                                                                alignItems:
                                                                    'center',

                                                                justifyContent:
                                                                    'center',

                                                                gap:
                                                                    '0.35rem',

                                                                cursor:
                                                                    'pointer',

                                                                fontSize:
                                                                    '0.68rem',

                                                                fontWeight:
                                                                    '800'
                                                            }}

                                                        >

                                                            {copiedIndex ===
                                                            index ? (

                                                                <>

                                                                    <CheckCheck
                                                                        size={14}
                                                                    />

                                                                    <span>
                                                                        Copied
                                                                    </span>

                                                                </>

                                                            ) : (

                                                                <>

                                                                    <Copy
                                                                        size={14}
                                                                    />

                                                                    <span>
                                                                        Copy
                                                                    </span>

                                                                </>

                                                            )}

                                                        </motion.button>


                                                        {/* REGENERATE */}

                                                        <motion.button

                                                            type="button"

                                                            whileHover={{
                                                                scale:
                                                                    1.04,

                                                                y:
                                                                    -1
                                                            }}

                                                            whileTap={{
                                                                scale:
                                                                    0.94
                                                            }}

                                                            onClick={() =>
                                                                regenerateResponse(
                                                                    index
                                                                )
                                                            }

                                                            disabled={
                                                                isThinking
                                                            }

                                                            title="Generate another response"

                                                            aria-label="Regenerate response"

                                                            style={{
                                                                height:
                                                                    '30px',

                                                                padding:
                                                                    '0 0.7rem',

                                                                borderRadius:
                                                                    '0.6rem',

                                                                border:
                                                                    '1px solid var(--glass-border)',

                                                                background:
                                                                    'var(--bg-card)',

                                                                color:
                                                                    'var(--text-main)',

                                                                display:
                                                                    'flex',

                                                                alignItems:
                                                                    'center',

                                                                justifyContent:
                                                                    'center',

                                                                gap:
                                                                    '0.35rem',

                                                                cursor:
                                                                    isThinking
                                                                        ? 'not-allowed'
                                                                        : 'pointer',

                                                                fontSize:
                                                                    '0.68rem',

                                                                fontWeight:
                                                                    '800',

                                                                opacity:
                                                                    isThinking
                                                                        ? 0.45
                                                                        : 1
                                                            }}

                                                        >

                                                            <RotateCcw
                                                                size={14}
                                                            />

                                                            <span>
                                                                Regenerate
                                                            </span>

                                                        </motion.button>

                                                    </motion.div>

                                                )}


                                                {/* ==================================================
                                                    ERROR / RETRY
                                                ================================================== */}

                                                {message.error && (

                                                    <motion.button

                                                        type="button"

                                                        onClick={() =>
                                                            retryResponse(
                                                                index
                                                            )
                                                        }

                                                        disabled={
                                                            isThinking
                                                        }

                                                        whileHover={{
                                                            scale:
                                                                1.03
                                                        }}

                                                        whileTap={{
                                                            scale:
                                                                0.96
                                                        }}

                                                        style={{
                                                            marginTop:
                                                                '0.45rem',

                                                            height:
                                                                '32px',

                                                            padding:
                                                                '0 0.8rem',

                                                            borderRadius:
                                                                '0.7rem',

                                                            border:
                                                                '1px solid var(--glass-border)',

                                                            background:
                                                                'var(--bg-card)',

                                                            color:
                                                                'var(--text-main)',

                                                            display:
                                                                'flex',

                                                            alignItems:
                                                                'center',

                                                            justifyContent:
                                                                'center',

                                                            gap:
                                                                '0.4rem',

                                                            cursor:
                                                                'pointer',

                                                            fontSize:
                                                                '0.72rem',

                                                            fontWeight:
                                                                '800'
                                                        }}

                                                    >

                                                        {retryingIndex ===
                                                        index ? (

                                                            <Loader2

                                                                size={14}

                                                                style={{
                                                                    animation:
                                                                        'spin 1s linear infinite'
                                                                }}

                                                            />

                                                        ) : (

                                                            <RotateCcw
                                                                size={14}
                                                            />

                                                        )}

                                                        <span>
                                                            Try again
                                                        </span>

                                                    </motion.button>

                                                )}

                                            </motion.div>

                                        );

                                    }

                                )}

                            </AnimatePresence>


                            <div
                                ref={
                                    messagesEndRef
                                }
                            />

                        </div>


                        {/* ==================================================
                            INPUT AREA
                        ================================================== */}

                        <form

                            onSubmit={
                                sendMessage
                            }

                            style={{
                                padding:
                                    '0.85rem',

                                borderTop:
                                    '1px solid var(--glass-border)',

                                background:
                                    'var(--bg-card)'
                            }}

                        >

                            <div

                                style={{
                                    display:
                                        'flex',

                                    alignItems:
                                        'center',

                                    gap:
                                        '0.5rem',

                                    padding:
                                        '0.35rem',

                                    borderRadius:
                                        '1.8rem',

                                    background:
                                        'var(--bg-main)',

                                    border:
                                        '1px solid var(--glass-border)',

                                    boxShadow:
                                        '0 5px 20px rgba(0,0,0,0.08)'
                                }}

                            >

                                {/* INPUT */}

                                <input

                                    type="text"

                                    value={
                                        input
                                    }

                                    onChange={
                                        e =>
                                            setInput(
                                                e.target.value
                                            )
                                    }

                                    disabled={
                                        isThinking
                                    }

                                    placeholder={

                                        translate

                                            ? `Translate into ${language}...`

                                            : 'Ask VoyageAI anything...'

                                    }

                                    style={{
                                        flex:
                                            1,

                                        height:
                                            '2.6rem',

                                        minWidth:
                                            0,

                                        padding:
                                            '0 0.85rem',

                                        background:
                                            'transparent',

                                        color:
                                            'var(--text-main)',

                                        border:
                                            'none',

                                        outline:
                                            'none',

                                        fontSize:
                                            '0.82rem'
                                    }}

                                />


                                {/* ==================================================
                                    STOP BUTTON
                                ================================================== */}

                                {isThinking ? (

                                    <motion.button

                                        type="button"

                                        onClick={
                                            stopGenerating
                                        }

                                        whileHover={{
                                            scale:
                                                1.04
                                        }}

                                        whileTap={{
                                            scale:
                                                0.94
                                        }}

                                        title="Stop generating"

                                        aria-label="Stop generating"

                                        style={{
                                            minWidth:
                                                '82px',

                                            height:
                                                '2.45rem',

                                            borderRadius:
                                                '1.3rem',

                                            border:
                                                'none',

                                            background:
                                                'var(--btn-gradient)',

                                            color:
                                                '#ffffff',

                                            display:
                                                'flex',

                                            alignItems:
                                                'center',

                                            justifyContent:
                                                'center',

                                            gap:
                                                '0.35rem',

                                            cursor:
                                                'pointer',

                                            fontSize:
                                                '0.7rem',

                                            fontWeight:
                                                '800',

                                            boxShadow:
                                                '0 5px 18px rgba(99,102,241,0.35)'
                                        }}

                                    >

                                        <Square

                                            size={13}

                                            fill="currentColor"

                                        />

                                        

                                    </motion.button>

                                ) : (

                                    /* ==================================================
                                       SEND BUTTON
                                    ================================================== */

                                    <motion.button

                                        type="submit"

                                        disabled={
                                            !input.trim()
                                        }

                                        whileHover={
                                            input.trim()
                                                ? {
                                                    scale:
                                                        1.05,

                                                    y:
                                                        -1
                                                }
                                                : {}
                                        }

                                        whileTap={{
                                            scale:
                                                0.94
                                        }}

                                        title="Send message"

                                        aria-label="Send message"

                                        style={{
                                            minWidth:
                                                '82px',

                                            height:
                                                '2.45rem',

                                            borderRadius:
                                                '1.3rem',

                                            border:
                                                'none',

                                            background:
                                                'var(--btn-gradient)',

                                            color:
                                                '#ffffff',

                                            display:
                                                'flex',

                                            alignItems:
                                                'center',

                                            justifyContent:
                                                'center',

                                            gap:
                                                '0.4rem',

                                            cursor:
                                                input.trim()
                                                    ? 'pointer'
                                                    : 'not-allowed',

                                            fontSize:
                                                '0.7rem',

                                            fontWeight:
                                                '800',

                                            opacity:
                                                input.trim()
                                                    ? 1
                                                    : 0.45,

                                            boxShadow:
                                                input.trim()
                                                    ? '0 5px 18px rgba(99,102,241,0.35)'
                                                    : 'none',

                                            flexShrink:
                                                0
                                        }}

                                    >

                                        <Send

                                            size={15}

                                            strokeWidth={2.8}

                                        />

                                        

                                    </motion.button>

                                )}

                            </div>


                            {/* INPUT HINT */}

                            <div

                                style={{
                                    textAlign:
                                        'center',

                                    fontSize:
                                        '0.58rem',

                                    opacity:
                                        0.5,

                                    marginTop:
                                        '0.4rem'
                                }}

                            >

                                {translate
                                    ? `Translation enabled · ${language}`
                                    : 'VoyageAI can answer travel questions dynamically'}

                            </div>

                        </form>

                    </motion.div>

                )}

            </AnimatePresence>


            {/* ==========================================================
                FLOATING CHAT BUTTON
            ========================================================== */}

            {!isOpen && (

                <motion.button

                    type="button"

                    onClick={() =>
                        setIsOpen(
                            true
                        )
                    }

                    initial={{
                        scale:
                            0,

                        opacity:
                            0
                    }}

                    animate={{
                        scale:
                            1,

                        opacity:
                            1
                    }}

                    whileHover={{
                        scale:
                            1.12
                    }}

                    whileTap={{
                        scale:
                            0.92
                    }}

                    title="Open VoyageAI Assistant"

                    aria-label="Open VoyageAI Assistant"

                    style={{
                        width:
                            '4.75rem',

                        height:
                            '4.75rem',

                        borderRadius:
                            '50%',

                        background:
                            'var(--btn-gradient)',

                        border:
                            '2.5px solid rgba(255,255,255,0.55)',

                        color:
                            '#ffffff',

                        boxShadow:
                            '0 12px 40px var(--shadow-glow), 0 0 25px rgba(99,102,241,0.5)',

                        display:
                            'flex',

                        alignItems:
                            'center',

                        justifyContent:
                            'center',

                        cursor:
                            'pointer',

                        position:
                            'relative'
                    }}

                >

                    <motion.div

                        animate={{
                            y:
                                [
                                    0,
                                    -4,
                                    0
                                ]
                        }}

                        transition={{
                            duration:
                                2.5,

                            repeat:
                                Infinity
                        }}

                        style={{
                            display:
                                'flex',

                            alignItems:
                                'center',

                            justifyContent:
                                'center',

                            color:
                                '#ffffff'
                        }}

                    >

                        <Bot

                            size={38}

                            strokeWidth={2.5}

                        />

                    </motion.div>


                    <motion.div

                        animate={{
                            scale:
                                [
                                    0.7,
                                    1,
                                    0.7
                                ],

                            rotate:
                                [
                                    0,
                                    20,
                                    0
                                ]
                        }}

                        transition={{
                            duration:
                                1.8,

                            repeat:
                                Infinity
                        }}

                        style={{
                            position:
                                'absolute',

                            top:
                                '7px',

                            right:
                                '8px',

                            color:
                                '#ffffff',

                            display:
                                'flex'
                        }}

                    >

                        <Sparkles
                            size={13}
                        />

                    </motion.div>


                    {/* OPEN LABEL */}

                    <span

                        style={{
                            position:
                                'absolute',

                            bottom:
                                '-27px',

                            left:
                                '50%',

                            transform:
                                'translateX(-50%)',

                            fontSize:
                                '0.65rem',

                            fontWeight:
                                '800',

                            whiteSpace:
                                'nowrap',

                            opacity:
                                0.75,

                            color:
                                'var(--text-main)'
                        }}

                    >

                        

                    </span>

                </motion.button>

            )}

        </div>

    );

};


export default Chatbot;