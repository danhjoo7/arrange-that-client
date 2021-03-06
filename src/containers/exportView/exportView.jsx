import React from 'react';
import { connect } from 'react-redux';

import { Card, CardContent } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';

import { HotTable } from '@handsontable/react';

const styles = () => ({
    sheet: {
        marginLeft: 10,
        marginTop: 10,
        marginBottom: 10,
        marginRight: 10,
        borderStyle: 'solid',
        borderWidth: '1px',
        borderColor: '#777',
    },
    card: {
        background: '#fafafa',
    },
    cardHeader: {
        paddingLeft: 10,
        paddingTop: 10,
        paddingBottom: 0,
        paddingRight: 10,
    },
    cardContent: {
        height: 'calc(100vh - 200px)',
        overflow: 'scroll',
    },
});

const defaultExportSettings = {
    showNotes: true,
    snapshotIds: [],
    showSideIndex: true,
    nameOfContainer: ['car'],
    nameOfFirstItem: ['driver'],
    nameOfSubsequentItems: ['passenger'],
    nameOfNotes: ['notes'],
};


// Generate a list from 1 to n, starting at index starting to height.
const generateVerticalIndex = (starting, height) => [...Array(height).keys()].map(i =>
    (i < starting ? [''] : [(i - starting) + 1]));

const getHeightOfSheet = sheet => sheet.length;

const getWidthOfSheet = sheet => sheet.map(row => row.length).reduce((x, y) => Math.max(x, y));

const generateBlankWidthBuffer = n => new Array(n).fill('');

const concatColumns = (leftSheet, rightSheet) => {
    const newSheet = [];
    for (let i = 0; i < leftSheet.length || i < rightSheet.length; i++) {
        if (i < leftSheet.length && i < rightSheet.length) {
            newSheet.push(leftSheet[i].concat(rightSheet[i]));
        } else if (i < leftSheet.length) {
            // past the right sheet, keep on adding on the left sheet with blank space
            newSheet.push(leftSheet[i].concat(generateBlankWidthBuffer(getWidthOfSheet(rightSheet))));
        } else {
            // Need to backfill with empty spaces
            newSheet.push(generateBlankWidthBuffer(getWidthOfSheet(leftSheet)).concat(rightSheet[i]));
        }
    }
    return newSheet;
};

const getContainer = (arrangement, containerId) => arrangement.containers[containerId];

const getContainerNotes = (snapshot, containerId) => {
    if (snapshot.containerNotes) {
        const note = snapshot.containerNotes.find(x => x.containerId === containerId);
        if (note) {
            return note.text;
        }
    }
    return undefined;
};

const getItem = (arrangement, itemId) => arrangement.items[itemId];

const ExportView = (props) => {
    const { classes } = props;
    const exportSettings = defaultExportSettings;

    const exportItem = (arrangement, itemId) => [getItem(arrangement, itemId).name];

    const exportContainer = (arrangement, snapshot, container) => {
        const containerSheet = [
            [getContainer(arrangement, container._id).name],
        ];
        if (exportSettings.showNotes) {
            containerSheet.unshift([getContainerNotes(snapshot, container._id)]);
        }
        container.items.forEach((itemId) => {
            containerSheet.push(exportItem(arrangement, itemId));
        });
        return containerSheet;
    };

    const exportSnapshot = (arrangement, snapshot) => {
        const snapshotHeader = [
            [snapshot.name],
        ];
        const snapshotFooter = [
            [],
        ];
        // Build sider
        let snapshotSheet = [
            exportSettings.nameOfContainer,
            exportSettings.nameOfFirstItem,
            exportSettings.nameOfSubsequentItems,
        ];
        if (exportSettings.showNotes) {
            snapshotSheet.unshift(exportSettings.nameOfNotes);
        }
        // Build containers
        let snapshotContainers = [
            [],
        ];
        snapshot.snapshotContainers.forEach((snapshotContainer) => {
            const containerSheet = exportContainer(arrangement, snapshot, snapshotContainer);
            snapshotContainers = concatColumns(snapshotContainers, containerSheet);
        });

        // Build side index
        if (exportSettings.showSideIndex) {
            const indexOfContainerName = snapshotSheet.indexOf(exportSettings.nameOfContainer);
            const containerIndex = generateVerticalIndex(
                indexOfContainerName + 1,
                getHeightOfSheet(snapshotContainers),
            );
            snapshotContainers = concatColumns(containerIndex, snapshotContainers);
        }

        snapshotSheet = concatColumns(snapshotSheet, snapshotContainers);
        return snapshotHeader.concat(snapshotSheet).concat(snapshotFooter);
    };

    const exportArrangement = (arrangement) => {
        const arrangementHeader = [
            [`arrange.space/arrangement/${arrangement._id}`],
        ];
        let arrangementSheet = [
            [arrangement.name],
        ];
        arrangement.snapshots.forEach((snapshot) => {
            const snapshotSheet = exportSnapshot(arrangement, snapshot);
            arrangementSheet = arrangementSheet.concat(snapshotSheet);
        });

        // Adding buffer to render rows
        arrangementHeader[0] = arrangementHeader[0].concat(generateBlankWidthBuffer(getWidthOfSheet(arrangementSheet)));
        return arrangementHeader.concat(arrangementSheet);
    };

    const data = exportArrangement(props.real);

    return (
        <Card className={classes.card}>
            <CardContent className={classes.cardContent}>
                <div className={classes.sheet} id="hot-app">
                    <HotTable
                        data={data}
                        rowHeaders={true}
                        colHeaders={true}
                        readOnly={true}
                        minSpareRows={1}
                        height="calc(100vh - 220px)"
                        licenseKey='non-commercial-and-evaluation' />
                </div>
            </CardContent>
        </Card>
    );
};

const mapStateToProps = (state, ownProps) => {
    const { real } = state;
    return { real };
};

const mapDispatchToProps = (dispatch, ownProps) => ({});

export default connect(
    mapStateToProps,
    mapDispatchToProps,
)(withStyles(styles)(ExportView));
