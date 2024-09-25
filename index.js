import axios from 'axios';
import fs from 'fs';

const postalCodes = fs.readFileSync('postalCode.csv', 'utf8').split('\n');

// let clubs = extractMethod1(); // one per one
let clubs = await extractMethod2(); // bypass limit

fs.writeFileSync('clubs.json', JSON.stringify(clubs));

async function extractMethod1() {
    let clubs = [];

    const postalCodeLength = postalCodes.length;

    for (let i = 0; i < postalCodeLength; i++) {
        console.log('Fetching data for ' + postalCodes[i] + ' ' + (i + 1) + '/' + postalCodeLength);

        await axios
            .get('https://api.englandrugby.com/v1/findrugby?postcode=' + postalCodes[i] + '&limit=200')
            .then(async response => {
                let fetchedClub = response.data.body.results;

                console.log('Found ' + fetchedClub.length + ' clubs');

                for (const club of fetchedClub) {
                    let clubIndex = clubs.findIndex(c => c.name === club.name);

                    if (clubIndex === -1) {
                        clubs.push(await extractClubData(club));
                    }
                }

                console.log('Total clubs: ' + clubs.length);
            }).catch(error => {
                console.error(error);
            });
    }

    return clubs;
}

async function extractMethod2() {
    let clubs = [];

    await axios
        .get('https://api.englandrugby.com/v1/findrugby?postcode=Aberdeen&limit=9999')
        .then(async response => {
            let fetchedClub = response.data.body.results;

            console.log('Found ' + fetchedClub.length + ' clubs');

            for (const club of fetchedClub) {
                clubs.push(await extractClubData(club));
            }

            console.log('Total clubs: ' + clubs.length);
        }).catch(error => {
            console.error(error);
        });

    return clubs;
}

async function extractClubData(clubData) {
    console.log('Fetching data for ' + clubData.name);

    let clubDetail = null;

    await axios
        .get('https://api.england-rfu.com/find-rugby/entity/' + clubData.organisation_id + '?type=clubs')
        .then(response => {
            clubDetail = response.data;
        }).catch(error => {
            console.error(error);
        });

    if (clubDetail === null) {
        return null;
    }

    return {
        clubName: clubDetail.name,
        sportOfTheClub: clubDetail.rugbyTypes.join(', '),
        numberOfMembers: '',
        numberOfTeams: clubDetail.teams.length,
        address: clubDetail.shortAddress,
        city: null,
        postalCode: clubDetail.postalCode,
        clubPhoneNumber: clubDetail.contacts.find(c => c.name === 'Club Phone number')?.phone ?? null,
        clubEmail: clubDetail.contacts.find(c => c.name === 'Club Email')?.email ?? null,
        clubWebsite: clubDetail.website ?? null,
        facebookPage: clubDetail.facebook ?? null,
        instagramPage: clubDetail.instagram ?? null,
        twitterPage: clubDetail.twitter ?? null,
        roleInTheClub: null,
        firstName: null,
        lastName: null,
        email: null,
        phone: null,
    }
}