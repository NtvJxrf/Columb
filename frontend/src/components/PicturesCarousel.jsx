import { Carousel, Image } from 'antd';

import img1 from '../assets/images/ballons.png'

const imageMap = {
    ballons: [img1],
    fbort: [],
    mattress: []
}

const PicturesCarousel = ({type}) => {
    const carouselImageStyle = {
        width: '100%',             
        height: 'auto',            
        objectFit: 'contain',      
    };
    return (
        <Carousel arrows infinite={false} key={type}>
            {imageMap[type].map((pic, index) => {
                return <Image src={pic} alt={`Slide ${index}`} style={carouselImageStyle}/>
            })}
        </Carousel>
    )
}

export default PicturesCarousel