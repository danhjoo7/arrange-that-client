import React, { Component } from 'react'

import { connect } from 'react-redux'

import { Grid, Typography } from '@material-ui/core'

import ItemCollection from 'containers/itemCollection/itemCollection'
import ContainerCollection from 'containers/containerCollection/containerCollection'
import ExportButton from 'components/exportbutton/exportbutton'

import { get } from 'services/request'
import { ARRANGEMENT } from 'services/serviceTypes'

import { setRealData, setUnassigned, setSnapshot } from 'actions/real/real'

import { DragDropContext } from 'react-beautiful-dnd'

import { reorder, move } from 'utils'

export class Arrange extends Component {
    constructor(props) {
        super(props)

        this.getDragItemColor = this.getDragItemColor.bind(this)
    }

    // Loads the state from the backend given the arrangement_id in the url param
    loadState () {
        const id = this.props.match.params.arrangement_id
        return get({url: ARRANGEMENT + "/" + id})
            .then(response => {
                if (response.data.arrangement === "no arrangement found") {
                    console.log("no arrangement found")
                }
                else {
                    this.props.setRealData(response.data.arrangement)
                }
                Promise.resolve()
            })
            .catch(err => {
                console.log(err)
                Promise.reject(err)
            })
    }

    componentDidMount () {
        this.loadState()
    }

    onDragEnd = result => {
        const { source, destination } = result
        if (!destination) { // dropped outside the list
            return
        }
        
        if (source.droppableId === destination.droppableId) { // dropped in same list
            let items = []
            if (source.droppableId === 'itemcollection') { // dropped in items' list, only reorder the items in list
                items = this.props.real.snapshots[0].unassigned
                items = reorder(
                    items,
                    source.index,
                    destination.index
                )
            
                this.props.setUnassigned(items)
            } else { // dropped in a container, only reorder the items in a container
                items = this.props.real.snapshots[0].snapshot[source.droppableId]
                items = reorder(
                    items,
                    source.index,
                    destination.index
                )

                this.props.setSnapshot({id: source.droppableId, items: items})
            }
        } else { // dropped in other list
            let result
            if (source.droppableId === 'itemcollection') { // dropped in a container from items' list, move
                result = move(
                    this.props.real.snapshots[0].unassigned,
                    this.props.real.snapshots[0].snapshot[destination.droppableId],
                    source,
                    destination
                )

                this.props.setUnassigned(result['source'])
                this.props.setSnapshot({id: destination.droppableId, items: result['destination']})
            } else if (destination.droppableId === 'itemcollection') { // dropped in items' list from a container, move item from a container to items' list
                result = move(
                    this.props.real.snapshots[0].snapshot[source.droppableId],
                    this.props.real.snapshots[0].unassigned,
                    source,
                    destination
                )

                this.props.setSnapshot({id: source.droppableId, items: result['source']})
                this.props.setUnassigned(result['destination'])
            } else { // dropped in a container from another container, move item from a container to another container
                result = move(
                    this.props.real.snapshots[0].snapshot[source.droppableId],
                    this.props.real.snapshots[0].snapshot[destination.droppableId],
                    source,
                    destination
                )

                this.props.setSnapshot({id: source.droppableId, items: result['source']})
                this.props.setSnapshot({id: destination.droppableId, items: result['destination']})
            }
        }
    }

    getDragItemColor(sourceId, destId) {
        return 'white'
    }

    render () {
        return (
            <DragDropContext onDragEnd={this.onDragEnd}>
                <Grid container spacing={24} className="arrange">
                    <Grid item xs={12} sm={4}>
                        <Typography variant="headline" gutterBottom align="left">
                            {this.props.real.name}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Typography variant="headline" gutterBottom align="center">
                            <ExportButton handleExport={this.exportToTSV}/>
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                    </Grid>
                    <Grid item xs={12} sm={4} md={3}>
                        <Typography variant="headline" gutterBottom align="left">
                            Unassigned
                        </Typography>
                        <ItemCollection items={this.props.real.items} unsnapshot_items={typeof this.props.real.snapshots[0] === "undefined" ? [] : this.props.real.snapshots[0].unassigned} getDragItemColor={this.getDragItemColor} />   
                    </Grid>
                    <Grid item xs={12} sm={8} md={9}>
                        <Typography variant="headline" gutterBottom align="left">
                            Arrangement
                        </Typography>
                        <ContainerCollection snapshot={this.props.real.snapshots[0]} containers={this.props.real.containers} items={this.props.real.items} getDragItemColor={this.getDragItemColor} />
                    </Grid>
                </Grid>
            </DragDropContext>
        )
    }
}

const mapStateToProps = (state, ownProps) => {
    const { real } = state
    return {
        real
    }
}

const mapDispatchToProps = (dispatch, ownProps) => {
    return {
        setRealData: (data) => {
            dispatch(setRealData(data))
        },
        setUnassigned: (data) => {
            dispatch(setUnassigned(data))
        },
        setSnapshot: (data) => {
            dispatch(setSnapshot(data))
        }
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
) (Arrange)
