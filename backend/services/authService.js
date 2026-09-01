const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../supabase');


// ======================================================
// JWT SECRET
// ======================================================

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error(
        'JWT_SECRET is missing from .env'
    );
}


// ======================================================
// REGISTER
// ======================================================

const register = async (
    name,
    email,
    password
) => {

    try {

        // --------------------------------------------------
        // Check if user already exists
        // --------------------------------------------------

        const {
            data: existingUser,
            error: checkError
        } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();


        if (checkError) {

            console.error(
                'Supabase user check error:',
                checkError
            );

            throw new Error(
                'Unable to check user'
            );

        }


        if (existingUser) {

            throw new Error(
                'User already exists'
            );

        }


        // --------------------------------------------------
        // Hash password
        // --------------------------------------------------

        const salt =
            await bcrypt.genSalt(10);

        const hashedPassword =
            await bcrypt.hash(
                password,
                salt
            );


        // --------------------------------------------------
        // Create user in Supabase
        // --------------------------------------------------

        const {
            data: user,
            error: insertError
        } = await supabase
            .from('users')
            .insert([
                {
                    name: name,
                    email: email,
                    password_hash: hashedPassword,
                    preferences: {}
                }
            ])
            .select(
                'id, name, email, preferences'
            )
            .single();


        if (insertError) {

            console.error(
                'Supabase user creation error:',
                insertError
            );


            // Duplicate email
            if (
                insertError.code === '23505'
            ) {

                throw new Error(
                    'User already exists'
                );

            }


            throw new Error(
                'Unable to create user'
            );

        }


        // --------------------------------------------------
        // Generate JWT
        // --------------------------------------------------

        const token =
            jwt.sign(
                {
                    id: user.id
                },
                JWT_SECRET,
                {
                    expiresIn: '7d'
                }
            );


        // --------------------------------------------------
        // Return
        // --------------------------------------------------

        return {

            user: user,

            token: token

        };

    } catch (error) {

        console.error(
            'Register error:',
            error
        );

        throw error;

    }

};


// ======================================================
// LOGIN
// ======================================================

const login = async (
    email,
    password
) => {

    try {

        // --------------------------------------------------
        // Find user in Supabase
        // --------------------------------------------------

        const {
            data: user,
            error: userError
        } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();


        if (userError) {

            console.error(
                'Supabase login query error:',
                userError
            );

            throw new Error(
                'Unable to login'
            );

        }


        // --------------------------------------------------
        // User doesn't exist
        // --------------------------------------------------

        if (!user) {

            throw new Error(
                'Invalid credentials'
            );

        }


        // --------------------------------------------------
        // Check password
        // --------------------------------------------------

        const isMatch =
            await bcrypt.compare(
                password,
                user.password_hash
            );


        if (!isMatch) {

            throw new Error(
                'Invalid credentials'
            );

        }


        // --------------------------------------------------
        // Generate JWT
        // --------------------------------------------------

        const token =
            jwt.sign(
                {
                    id: user.id
                },
                JWT_SECRET,
                {
                    expiresIn: '7d'
                }
            );


        // --------------------------------------------------
        // Return user
        // --------------------------------------------------

        return {

            user: {

                id: user.id,

                name: user.name,

                email: user.email,

                preferences:
                    user.preferences

            },

            token: token

        };

    } catch (error) {

        console.error(
            'Login error:',
            error
        );

        throw error;

    }

};


// ======================================================
// EXPORT
// ======================================================

module.exports = {

    register,

    login

};