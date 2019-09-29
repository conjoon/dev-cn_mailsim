/**
 * conjoon
 * dev-cn_mailsim
 * Copyright (C) 2019 Thorsten Suckow-Homberg https://github.com/conjoon/dev-cn_mailsim
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
 * USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 *
 */
Ext.define('conjoon.dev.cn_mailsim.data.mail.ajax.sim.message.MessageTable', {

    singleton : true,

    requires : [
        'conjoon.dev.cn_mailsim.data.mail.ajax.sim.message.AttachmentTable'
    ],

    messageBodies : null,

    messageItems : null,

    baseMessageItems : null,


    buildRandomNumber : function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    buildRandomSizeInBytes : function() {
        var me = this;

        return me.buildRandomNumber(1, 10000000);
    },

    buildPreviewText : function(mailAccountId, mailFolderId, id) {
        var me = this;

        return me.getMessageBody(mailAccountId, mailFolderId, id).textPlain.substring(0, 200);
    },

    buildRandomDate : function() {
        var me = this,
            dt  = new Date(),
            y  = me.buildRandomNumber(2007, dt.getFullYear()),
            m  = me.buildRandomNumber(1, y == dt.getFullYear() ? dt.getMonth() + 1 : 12),
            d  = me.buildRandomNumber(1, y == dt.getFullYear() && m - 1 == dt.getMonth() ? dt.getDate() : 31),
            h  = me.buildRandomNumber(
                0,
                y == dt.getFullYear() && m - 1 == dt.getMonth() && d == dt.getDate() ? dt.getHours() : 23
            ),
            i  = me.buildRandomNumber(
                0,
                y == dt.getFullYear() && m - 1 == dt.getMonth() && d == dt.getDate() ? dt.getMinutes() : 59
            ),
            pad = function(v) {
                return v < 10 ? '0' + v : v;
            };

        return Ext.String.format(
            "{0}-{1}-{2} {3}:{4}",
            y, pad(m), pad(d), pad(h), pad(i)
        );
    },


    buildAddresses : function(type, i) {
        // special for tests
        if (i == 1 && type !== 'to') {
            return [];
        }

        return [{
            name    : 'Firstname Lastname' + type,
            address : 'name' + type + '@domain.tld'
        }, {
            name    : 'Firstname 1 Lastname 2' + type,
            address : 'name1' + type + '@domain1.tld'
        }]
    },

    remove : function(record) {
        const me = this;

        let items = me.messageItems;
        console.log("REMOVING", record.getId())
        for (var i = 0, len = items.length; i < len; i++) {
            if (items[i].id === record.getId()) {
                items.splice(i, 1);
                console.log("REMOVED, NEW LENGTH ", items.length)
                return;
            }
        }
    },

    createMessageBody : function(mailAccountId, mailFolderId, data) {

        if (arguments.length !== 3) {
            Ext.raise("Unexpected missing arguments");
        }

        var me  = this,
            inc = Ext.id(),
            newId = 0;

        // make sure alls message items are initialized along withh their
        // messagebodies
        me.getMessageItems();

        if (!me.messageBodies) {
            me.messageBodies = {};
        }

        for (var i in me.messageBodies) {
            var tmp = parseInt(me.messageBodies[i].id, 10);
            newId = Math.max(tmp, newId);
        }

        me.messageBodies[inc] = Ext.applyIf({
            id : ++newId,
            mailAccountId : mailAccountId,
            mailFolderId : mailFolderId
        }, data);

        return me.messageBodies[inc];
    },


    updateMessageBody : function(mailAccountId, mailFolderId, id, data, skipUpdate = false) {

        if (arguments.length < 4) {
            Ext.raise("Unexpected missing arguments");
        }

        var me      = this,
            message = me.getMessageBody(mailAccountId, mailFolderId, id);

        // just in case
        delete data.id;

        if (!data.textPlain && data.textHtml) {
            data.textPlain = Ext.util.Format.stripTags(data.textHtml);
        }

        Ext.apply(message, data);

        // swap
        if (data.mailFolderId && mailFolderId !== data.mailFolderId) {
            delete me.messageBodies[[mailAccountId, mailFolderId, id].join('-')];
            me.messageBodies[[mailAccountId, data.mailFolderId, id].join('-')] = message;
        }

        // force to refresh the date
        if (skipUpdate !== true) {
            me.updateAllItemData(mailAccountId, mailFolderId, id, {});
        }

        return message;
    },

    messages : [
        "<ul><li><img /><div style='background:black'>testmeclickyo</div>Blindtext <a href='mailto:dev@conjoon.org'><b> mail me @ conjoon</b></a> - Lorem <a href='http://www.conjoon.org'><b>conjoon</b></a> ipsum dolor sit amet, consectetuer adipiscing  elit. Aenean commodo ligula eget dolor. Aenean massa.</li><li>Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem.</li> <li>Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu.</li> <li>In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede mollis pretium. Integer tincidunt.</li></ul>",
        "<p>Text <a href='mailto:dev@conjoon.org'><b> mail me @ conjoon</b></a> here: Lorem ipsum dolor sit amet, consectetuer <a href='http://www.conjoon.org'><b>conjoon</b></a> adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa <strong>strong</strong>. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam dictum felis eu pede <a class=\"external ext\" href=\"#\">link</a> mollis pretium. Integer tincidunt. Cras dapibus. Vivamus elementum semper nisi. Aenean vulputate eleifend tellus. Aenean leo ligula, porttitor eu, consequat vitae, eleifend ac, enim. Aliquam lorem ante, dapibus in, viverra quis, feugiat a, tellus. Phasellus viverra nulla ut metus varius laoreet. Quisque rutrum. Aenean imperdiet. Etiam ultricies nisi vel augue. Curabitur ullamcorper ultricies nisi.</p>",
        "<blockquote><img />Following <a href='mailto:dev@conjoon.org'><b> mail me @ conjoon</b></a> news! <a href='http://www.conjoon.org'><b>conjoon</b></a> Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Aenean commodo ligula eget dolor. Aenean massa <strong>strong</strong>. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec quam felis, ultricies nec, pellentesque eu, pretium quis, sem. Nulla consequat massa quis enim. Donec pede justo, fringilla vel, aliquet nec, vulputate eget, arcu. In <em>em</em> enim justo, rhoncus ut, imperdiet a, venenatis vitae, justo. Nullam <a class=\"external ext\" href=\"#\">link</a> dictum felis eu pede mollis pretium. </blockquote>"
    ],

    peekMessageBody : function(mailAccountId, mailFolderId, id) {

        if (arguments.length !== 3) {
            Ext.raise("Unexpected missing arguments");
        }

        var me = this,
            key = mailAccountId + '-' + mailFolderId + '-' + id,
            message;


        if (!me.messageBodies) {
            me.messageBodies = {};
        }

        if (me.messageBodies[key]) {
            return true;
        }

        return false;
    },

    getMessageBody : function(mailAccountId, mailFolderId, id) {

        if (arguments.length !== 3) {
            Ext.raise("Unexpected missing arguments");
        }

        var me = this,
            key = mailAccountId + '-' + mailFolderId + '-' + id,
            message;


        if (!me.messageBodies) {
            me.messageBodies = {};
        }

        if (me.messageBodies[key]) {
            return me.messageBodies[key];
        }

        message = this.messages[me.buildRandomNumber(0, 2)];

        me.messageBodies[key] = {
            id                    : id,
            mailFolderId          : mailFolderId,
            mailAccountId         : mailAccountId,
            textHtml              : message,
            textPlain             : Ext.util.Format.stripTags(message)
        };

        return me.messageBodies[key];
    },

    getNextMessageDraftKey : function() {
        var me = this;

        return (me.getMessageDrafts().length + 1) + '';
    },


    getMessageDraft : function(mailAccountId, mailFolderId, id) {

        if (arguments.length !== 3) {
            debugger;
            Ext.raise("Unexpected missing arguments");
        }

        var me     = this,
            drafts = me.getMessageDrafts();

        for (var i = 0, len = drafts.length; i < len; i++) {
            if (drafts[i]['mailAccountId'] == mailAccountId &&
                drafts[i]['mailFolderId'] == mailFolderId &&
                drafts[i]['id'] == id) {
                return drafts[i];
            }
        }

        return null;
    },


    getMessageDrafts : function() {

        var me               = this,
            messageDrafts    = [],
            baseMessageItems = me.buildBaseMessageItems();

        if (me.messageDrafts) {
            return me.messageDrafts;
        }

        for (var i = 0; i < baseMessageItems.length; i++) {

            var bccAddresses = me.buildAddresses('bcc', i);

            messageDrafts.push(Ext.apply({
                bcc     : bccAddresses,
                replyTo : i !== 0 && me.buildRandomNumber(0, 1)
                          ? sender[me.buildRandomNumber(0, 5)]
                          : undefined
            }, baseMessageItems[i]));

        }

        me.messageDrafts = messageDrafts;

        return me.messageDrafts;
    },


    updateMessageDraft : function(mailAccountId, mailFolderId, id, values) {

        if (arguments.length !== 4) {
            Ext.raise("Unexpected missing arguments");
        }


        var me = this;

        me.updateAllItemData(mailAccountId, mailFolderId, id, values);

    },


    updateMessageItem : function(mailAccountId, mailFolderId, id, values) {

        if (arguments.length !== 4) {
            Ext.raise("Unexpected missing arguments");
        }

        var me = this;

        return me.updateAllItemData(mailAccountId, mailFolderId, id, values);
    },


    createMessageDraft : function(mailAccountId, mailFolderId, draftData) {

        if (arguments.length != 3) {
            Ext.raise("Unexpected missing argument");
        }

        var me            = this,
            messageId     = Ext.id(),
            id            = me.getNextMessageDraftKey(),
            messageDrafts = me.getMessageDrafts(),
            messageItems  = me.getMessageItems(),
            date          = Ext.util.Format.date(new Date(), 'Y-m-d H:i');

        //manually fake attachments and messageBody
        conjoon.dev.cn_mailsim.data.mail.ajax.sim.message.AttachmentTable.attachments[id] = null;

        var mb = me.getMessageBody(mailAccountId, mailFolderId, id);
        mb.textPlain = "";
        mb.textHtml = "";

        messageDrafts.push(Ext.apply(draftData, {
            messageId       : messageId,
            id              : id,
            mailFolderId    : mailFolderId,
            mailAccountId   : mailAccountId,
            date            : date
        }));

        messageItems.push(Ext.apply(draftData, {
            messageId       : messageId,
            id              : id,
            mailFolderId    : mailFolderId,
            mailAccountId   : mailAccountId,
            date            : date
        }));

        me.baseMessageItems.push(Ext.apply(draftData, {
            messageId       : messageId,
            id              : id,
            mailFolderId    : mailFolderId,
            mailAccountId   : mailAccountId,
            date            : date
        }));


        // re init
        me.getMessageItems();
        me.getMessageDrafts();

        return messageDrafts[messageDrafts.length - 1];
    },


    updateAllItemData : function(mailAccountId, mailFolderId, id, values) {

        if (arguments.length !== 4) {
            Ext.raise("Unexpected missing arguments");
        }

        var me     = this,
            draft  = me.getMessageDraft(mailAccountId, mailFolderId, id),
            item   = me.getMessageItem(mailAccountId, mailFolderId, id),
            dataItems = [draft, item],
            dataItems, item, skipDate = false;

        let vals = [];

        for (let a in values) {
            if (!values.hasOwnProperty(a)) {
                continue;
            }

            vals.push(a);
        }

        if (vals.indexOf('localId') !== -1 &&
            vals.indexOf('mailAccountId') !== -1 &&
            vals.indexOf('id') !== -1 &&
            vals.indexOf('mailFolderId') !== -1) {
            if (vals.length === 4  ||
                (vals.length === 5 && (vals.indexOf('seen') !== -1 || vals.indexOf('flagged') !== -1 || vals.indexOf('answered') !== -1))) {
                skipDate = true;
            }
        }

        // flag might be set by item sim without compound key info in vals
        if (vals.length === 1 && vals.indexOf('answered') !== -1) {
            skipDate = true;
        }

        if (values.mailFolderId && values.mailFolderId != mailFolderId) {

            let hasAtt = conjoon.dev.cn_mailsim.data.mail.ajax.sim.message.AttachmentTable.moveAttachments(
                mailAccountId, mailFolderId, id, {
                    mailFolderId : values.mailFolderId
                }
            );

            values.hasAttachments = hasAtt && hasAtt.length ? 1 : 0;

            me.updateMessageBody(mailAccountId, mailFolderId, id, {
                mailFolderId : values.mailFolderId
            }, true); // skip update to prevent possible recursion
        }

        for (var i = 0, len = dataItems.length; i < len; i++) {

            item = dataItems[i];

            // possible that we landed from DraftAttachment Test here and that
            // items are not existing
            if (!item) {
                continue;
            }

            if (skipDate === false) {
                item['date'] = Ext.util.Format.date(new Date(), 'Y-m-d H:i');
            }

            for (var prop in values) {

                if (!item.hasOwnProperty(prop)) {
                    // we are updating an existing item with properties that might not
                    // existed previously - dont skip!
                    //continue;
                }

                switch (prop) {
                    case 'to':
                    case 'cc':
                    case 'bcc':
                    case 'from':
                        if (Ext.isString(values[prop]))
                        item[prop] = Ext.JSON.decode(values[prop]);
                        break;
                    case 'date':
                        // already set above
                        break;
                    default:
                        item[prop] = values[prop];
                        break;
                }


            }

        }
        return item;
    },


    getMessageItemAt : function(pos) {

        const me = this;

        return me.getMessageItems()[pos];

    },

    getMessageItem : function(mailAccountId, mailFolderId, id) {
        if (arguments.length !== 3) {
            Ext.raise("Unexpected missing arguments");
        }
        var me    = this,
            items = me.getMessageItems();

        for (var i = 0, len = items.length; i < len; i++) {
            if (items[i]['mailAccountId'] == mailAccountId &&
                items[i]['mailFolderId'] == mailFolderId &&
                items[i]['id'] == id) {
                return items[i];
            }
        }

        return null;
    },


    getMessageItems : function() {

        var me               = this,
            AttachmentTable  = conjoon.dev.cn_mailsim.data.mail.ajax.sim.message
                               .AttachmentTable,
            baseMessageItems = me.buildBaseMessageItems(),
            messageItems     = subjects = sender = [], attach;


        if (me.messageItems) {

            for (var i = 0, len = me.messageItems.length; i < len; i++) {

                me.messageItems[i].previewText = me.buildPreviewText(
                    baseMessageItems[i].mailAccountId,
                    baseMessageItems[i].mailFolderId,
                    baseMessageItems[i].id
                );
            }

            return me.messageItems;
        }

        for (var i = 0; i < baseMessageItems.length; i++) {

            messageItems.push(Ext.apply({
                // leave first one as unread for tests
                hasAttachments : AttachmentTable.createRandomAttachments(
                    baseMessageItems[i].mailAccountId,
                    baseMessageItems[i].mailFolderId,
                    baseMessageItems[i].id
                ) ? 1 : 0,
                size           : me.buildRandomSizeInBytes(),
                previewText    : me.buildPreviewText(
                    baseMessageItems[i].mailAccountId,
                    baseMessageItems[i].mailFolderId,
                    baseMessageItems[i].id
                )
            }, baseMessageItems[i]));
        }

        me.messageItems = messageItems;

        return me.messageItems;
    },


    /**
     * Builds the base message items to be used as the data for Sims.
     *
     * @return {Array}
     */
    buildBaseMessageItems : function() {
        var me = this,
            baseMessageItems = subjects = sender = [];

        if (me.baseMessageItems) {
            return me.baseMessageItems;
        }

        subjects = [
            'Welcome to conjoon',
            'Re: Ihre Buchung in der Unterkunft',
            'Achtung! DVBT Antennen sind bald nutzlos, Thorsten Suckow-Homberg',
            'Verbindliche Bestellung Banshee Headbadge',
            'Vielen Dank für Ihre Bestellung',
            'Monte Walsh [Blu Ray] und mehr aus DVD & Blu Ray Klassiker'
        ];

        sender = [
            {address : 'tsuckow@conjoon.org', name : 'conjoonadmin'},
            {address : 'service@booking.com', name : 'Booking.com'},
            {address : 'info@ebay.de',        name : 'ebay Verkäufer Team'},
            {address : 'mailer@mtb-news.de',  name : 'MTB News'},
            {address : 'service@otto.de',     name : 'Otto GmbH'},
            {address : 'info@amazon.de',      name : 'Amazon'}
        ];

        var mailFolderId, mailAccountId = 'dev_sys_conjoon_org', mailFolders = [
            "INBOX",
            "INBOX.Sent Messages",
            "INBOX.Junk",
            "INBOX.Drafts",
            "INBOX.Trash"
        ];

        for (var i = 0; i < 10000; i++) {

            mailFolderId = mailFolders[i % 5];

            let cfg = {
                id              :  (i + 1) + '',
                date            : me.buildRandomDate(i < 100),
                // leave first one as unread for tests
                subject         : /*mailFolderId + '-' + (i) + '-' +*/ subjects[me.buildRandomNumber(0, 5)],
                from            : i === 0
                                  ? 'from@domain.tld'
                                  : sender[me.buildRandomNumber(0, 5)],
                to              : me.buildAddresses('to', i),
                cc              : me.buildAddresses('cc', i),
                mailFolderId    : mailFolderId,
                mailAccountId   : mailAccountId,
                testProp        : i,
                messageId       : Ext.id(),
                seen            : i == 0 ? false : (me.buildRandomNumber(0, 1) ? true : false),
                draft           : mailFolderId == "INBOX.Drafts"
                                  ? true
                                  : i == 0 ? false : (me.buildRandomNumber(0, 1) ? true : false)
            };


            baseMessageItems.push(cfg);
        }

        me.baseMessageItems = baseMessageItems;

        return me.baseMessageItems;
    },


    resetAll : function() {
        const me = this;

        me.messageDrafts = me.baseMessageItems = me.messageItems = me.messageBodies = null;

        conjoon.dev.cn_mailsim.data.mail.ajax.sim.message.AttachmentTable.resetAll();

    }




});