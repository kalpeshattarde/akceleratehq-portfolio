/************************************************************
 * SOCIAL MEDIA COMMAND CENTER
 * COMPLETE FIXED GOOGLE APPS SCRIPT BACKEND
 ************************************************************/

const SPREADSHEET_ID =
  '1opKiRtMk4Hc-7QsRdasz_WYDyG-w9RojGATbweNE_wc';


/* =========================================================
   WEB APP
   ========================================================= */

function doGet() {
  return HtmlService
    .createHtmlOutputFromFile('Index')
    .setTitle('Social Media Command Center')
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );
}


/* =========================================================
   MAIN DASHBOARD DATA FUNCTION
   ========================================================= */

function getDashboardData() {

  try {

    const ss =
      SpreadsheetApp.openById(SPREADSHEET_ID);

    const configs = [
      {
        sheet: 'Linkedin',
        platform: 'LinkedIn'
      },
      {
        sheet: 'Instagram',
        platform: 'Instagram'
      },
      {
        sheet: 'Youtube',
        platform: 'YouTube'
      },
      {
        sheet: 'Facebook',
        platform: 'Facebook'
      }
    ];

    const records = [];

    configs.forEach(config => {

      const sheet =
        ss.getSheetByName(config.sheet);

      if (!sheet) {
        console.log(
          'Sheet not found: ' + config.sheet
        );
        return;
      }

      const values =
        sheet
          .getDataRange()
          .getValues();

      if (!values || values.length < 2) {
        return;
      }

      const headers =
        values[0].map(header =>
          String(header || '').trim()
        );

      values.slice(1).forEach(row => {

        const empty =
          row.every(value =>
            value === '' ||
            value === null ||
            value === undefined
          );

        if (empty) {
          return;
        }

        const obj = {};

        headers.forEach((header, index) => {

          if (header) {
            obj[header] = row[index];
          }

        });

        const record =
          normalizeRow(
            obj,
            config.platform
          );

        /*
         * Require a Post ID where possible.
         */
        if (record.postId) {
          records.push(record);
        }

      });

    });

    console.log(
      'Loaded records: ' + records.length
    );

    return {
      success: true,
      records: records,
      total: records.length,
      updatedAt:
        new Date().toISOString(),
      spreadsheet:
        ss.getName()
    };

  } catch (error) {

    console.error(
      'getDashboardData ERROR: ' +
      error.toString()
    );

    return {
      success: false,
      records: [],
      total: 0,
      updatedAt:
        new Date().toISOString(),
      error:
        error.toString()
    };

  }
}


/* =========================================================
   NORMALIZE ROW
   ========================================================= */

function normalizeRow(row, platform) {


  /* -------------------------------------------------------
     Get first available field
     ------------------------------------------------------- */

  function get(names, fallback) {

    if (fallback === undefined) {
      fallback = '';
    }

    for (let i = 0; i < names.length; i++) {

      const name = names[i];

      if (
        Object.prototype.hasOwnProperty.call(
          row,
          name
        )
      ) {

        const value = row[name];

        if (
          value !== '' &&
          value !== null &&
          value !== undefined
        ) {
          return value;
        }

      }

    }

    return fallback;
  }


  /* -------------------------------------------------------
     Convert to number
     ------------------------------------------------------- */

  function num(names) {

    let value =
      get(names, 0);

    if (typeof value === 'string') {

      value =
        value
          .replace(/,/g, '')
          .replace(/%/g, '')
          .trim();

    }

    const n =
      Number(value);

    return isFinite(n) ? n : 0;
  }


  /* =======================================================
     BASIC FIELDS
     ======================================================= */

  const postId =
    String(
      get(
        ['Post ID'],
        ''
      )
    );


  const brand =
    String(
      get(
        [
          'Brand Name',
          'Brand',
          'Account'
        ],
        'Unassigned'
      )
    );


  const title =
    String(
      get(
        [
          'Post Title',
          'Video Title',
          'Post Name/Topic',
          'Title',
          'Post Title / Content'
        ],
        'Untitled Post'
      )
    );


  const type =
    String(
      get(
        [
          'Content Type (Poll/Doc)',
          'Content Type',
          'Format (Reel/Static)',
          'Format',
          'Data Type',
          'Type'
        ],
        'Other'
      )
    );


  /* =======================================================
     DATE
     ======================================================= */

  let date =
    get(
      ['Date'],
      ''
    );


  if (
    date instanceof Date &&
    !isNaN(date.getTime())
  ) {

    date =
      Utilities.formatDate(
        date,
        Session.getScriptTimeZone(),
        'yyyy-MM-dd'
      );

  } else {

    date =
      String(date || '');

  }


  /* =======================================================
     MONTH
     ======================================================= */

  let month =
    get(
      ['Month'],
      ''
    );


  if (!month && date) {

    const d =
      new Date(date);

    if (!isNaN(d.getTime())) {

      month =
        Utilities.formatDate(
          d,
          Session.getScriptTimeZone(),
          'MMMM'
        );

    }

  }

  month =
    String(month || '');


  /* =======================================================
     LINK
     ======================================================= */

  const link =
    String(
      get(
        [
          'Links',
          'Link',
          'URL'
        ],
        ''
      )
    );


  /* =======================================================
     METRICS
     ======================================================= */

  let views = 0;
  let reach = 0;

  let likes = 0;
  let comments = 0;
  let shares = 0;
  let saves = 0;

  let clicks = 0;
  let reactions = 0;
  let reposts = 0;

  let engagement = 0;
  let engagementRate = 0;


  /* =======================================================
     LINKEDIN
     ======================================================= */

  if (platform === 'LinkedIn') {

    reactions =
      num(['Reactions']);

    comments =
      num(['Comments']);

    reposts =
      num(['Reposts']);

    clicks =
      num(['Clicks']);

    views =
      num(['Impressions']);

    reach =
      views;

    engagement =
      reactions +
      comments +
      reposts +
      clicks;

    engagementRate =
      num([
        'Engagement Rate (%)',
        'Engagement Rate'
      ]);

    if (
      !engagementRate &&
      views > 0
    ) {

      engagementRate =
        engagement /
        views *
        100;

    }

  }


  /* =======================================================
     INSTAGRAM
     ======================================================= */

  else if (platform === 'Instagram') {

    views =
      num(['Views']);

    /*
     * Instagram source does not have Reach.
     * Use Views as available exposure.
     */
    reach =
      views;

    likes =
      num(['Likes']);

    /*
     * These columns are not present
     * in the Instagram source.
     */
    comments = 0;
    shares = 0;
    saves = 0;

    engagement =
      likes;

    /*
     * Calculate engagement rate.
     */
    if (views > 0) {

      engagementRate =
        engagement /
        views *
        100;

    }

  }


  /* =======================================================
     YOUTUBE
     ======================================================= */

  else if (platform === 'YouTube') {

    likes =
      num(['Likes']);

    comments =
      num(['Comments']);

    shares =
      num(['Shares']);

    saves =
      num(['Saves']);

    views =
      num(['Views']);

    reach =
      num(['Reach']);

    /*
     * Use supplied Overall Engagement
     * when available.
     */
    const supplied =
      num([
        'Overall Engagement'
      ]);

    if (supplied > 0) {

      engagement =
        supplied;

    } else {

      engagement =
        likes +
        comments +
        shares +
        saves;

    }

    engagementRate =
      num([
        'Engagement Rate (%)',
        'Engagement Rate'
      ]);

    if (
      !engagementRate &&
      views > 0
    ) {

      engagementRate =
        engagement /
        views *
        100;

    }

  }


  /* =======================================================
     FACEBOOK
     ======================================================= */

  else if (platform === 'Facebook') {

    likes =
      num(['Likes']);

    comments =
      num(['Comments']);

    shares =
      num(['Shares']);

    saves =
      num(['Saves']);

    views =
      num(['Views']);

    reach =
      num(['Reach']);

    /*
     * Use supplied Overall Engagement
     * when available.
     */
    const supplied =
      num([
        'Overall Engagement'
      ]);

    if (supplied > 0) {

      engagement =
        supplied;

    } else {

      engagement =
        likes +
        comments +
        shares +
        saves;

    }

    engagementRate =
      num([
        'Engagement Rate (%)',
        'Engagement Rate'
      ]);

    if (
      !engagementRate &&
      views > 0
    ) {

      engagementRate =
        engagement /
        views *
        100;

    }

  }


  /* =======================================================
     RETURN STANDARDIZED OBJECT
     ======================================================= */

  return {

    postId:
      postId,

    platform:
      platform,

    brand:
      brand,

    date:
      date,

    month:
      month,

    title:
      title,

    type:
      type,

    views:
      views,

    reach:
      reach,

    likes:
      likes,

    comments:
      comments,

    shares:
      shares,

    saves:
      saves,

    clicks:
      clicks,

    reactions:
      reactions,

    reposts:
      reposts,

    engagement:
      engagement,

    engagementRate:
      engagementRate,

    link:
      link

  };

}


/* =========================================================
   DEPLOYMENT / PERMISSION DIAGNOSTIC
   ========================================================= */

function WEB_APP_TEST() {

  try {

    const user =
      Session.getEffectiveUser().getEmail();

    const ss =
      SpreadsheetApp.openById(
        SPREADSHEET_ID
      );

    return {

      success: true,

      user:
        user,

      spreadsheet:
        ss.getName(),

      spreadsheetId:
        ss.getId(),

      sheets:
        ss
          .getSheets()
          .map(sheet =>
            sheet.getName()
          )

    };

  } catch (error) {

    return {

      success: false,

      user:
        Session
          .getEffectiveUser()
          .getEmail(),

      error:
        error.toString()

    };

  }

}


/* =========================================================
   CONNECTION TEST
   ========================================================= */

function testConnection() {

  const result = {

    success: false,

    effectiveUser: '',

    activeSpreadsheet: '',

    openedSpreadsheet: '',

    sheets: [],

    error: ''

  };


  try {

    result.effectiveUser =
      Session
        .getEffectiveUser()
        .getEmail();


    /* Active spreadsheet */
    try {

      const active =
        SpreadsheetApp
          .getActiveSpreadsheet();

      if (active) {

        result.activeSpreadsheet =
          active.getName();

      }

    } catch (e) {

      result.activeSpreadsheet =
        'Could not access active spreadsheet';

    }


    /* Direct spreadsheet */
    const ss =
      SpreadsheetApp.openById(
        SPREADSHEET_ID
      );


    result.openedSpreadsheet =
      ss.getName();


    result.sheets =
      ss
        .getSheets()
        .map(sheet =>
          sheet.getName()
        );


    result.success = true;


    console.log(
      JSON.stringify(
        result,
        null,
        2
      )
    );


    return result;

  } catch (error) {

    result.error =
      error.toString();


    console.error(
      JSON.stringify(
        result,
        null,
        2
      )
    );


    return result;

  }

}


/* =========================================================
   RAW DATA TEST
   ========================================================= */

function TEST_DATA() {

  const ss =
    SpreadsheetApp.openById(
      SPREADSHEET_ID
    );


  const result = {};


  ss
    .getSheets()
    .forEach(sheet => {

      const values =
        sheet
          .getDataRange()
          .getDisplayValues();


      result[
        sheet.getName()
      ] = {

        rows:
          values.length,

        columns:
          values.length
            ? values[0].length
            : 0,

        headers:
          values.length
            ? values[0]
            : [],

        sample:
          values.length > 1
            ? values[1]
            : []

      };

    });


  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}


/* =========================================================
   RECORD COUNT TEST
   ========================================================= */

function TEST_RECORD_COUNT() {

  const data =
    getDashboardData();


  const counts = {};


  if (
    data &&
    data.records
  ) {

    data.records.forEach(record => {

      if (
        !counts[record.platform]
      ) {

        counts[record.platform] = 0;

      }

      counts[
        record.platform
      ]++;

    });

  }


  const result = {

    success:
      data.success,

    total:
      data.total,

    counts:
      counts,

    error:
      data.error || ''

  };


  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );


  return result;

}
